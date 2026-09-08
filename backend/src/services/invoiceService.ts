/**
 * Invoice generation service.
 *
 * Phase 4 stores invoices as `Invoice` rows with a JSON line-item array, and
 * optionally persists a PDF in S3 (when configured). When S3 is unavailable
 * the caller can call `streamInvoicePdf(invoiceId, res)` which generates the
 * PDF on-the-fly and streams it back to the client.
 *
 * Sequential invoice numbers are generated using a database sequence-like
 * pattern: `INV-YYYY-NNNN`, scoped to the calendar year.
 */

import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { Prisma } from '@prisma/client';
import { Readable } from 'node:stream';
import { prisma } from '../lib/db/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger/logger';
import { NotFoundError, BadRequestError } from '../lib/errors/AppError';
import { storage } from '../lib/storage/s3';
import { STORAGE_KEYS } from '@credible/shared';
import type { InvoiceLineItem } from '@credible/types';

const VAT_RATE = Number.parseFloat(process.env.INVOICE_VAT_RATE ?? '0.05');

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function currentYear(): number {
  return new Date().getFullYear();
}

async function nextInvoiceNumber(): Promise<string> {
  // Best-effort sequential numbering within the calendar year.
  const year = currentYear();
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });
  const lastSeq = latest
    ? Number.parseInt(latest.invoiceNumber.slice(prefix.length), 10) || 0
    : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
}

interface BuildLineItemsInput {
  plan: string;
  billingCycle: string;
  amount: number;
}

function buildLineItems(input: BuildLineItemsInput): {
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = round2(input.amount);
  const tax = round2(subtotal * VAT_RATE);
  const total = round2(subtotal + tax);
  const items: InvoiceLineItem[] = [
    {
      description: `${input.plan} plan — ${input.billingCycle.toLowerCase()}`,
      quantity: 1,
      unitPrice: subtotal,
      total: subtotal,
    },
    {
      description: `VAT (${(VAT_RATE * 100).toFixed(0)}%)`,
      quantity: 1,
      unitPrice: tax,
      total: tax,
    },
  ];
  return { items, subtotal, tax, total };
}

export const invoiceService = {
  /**
   * Create and persist an invoice for a successful payment. Uses an explicit
   * transaction so invoice + payment updates are atomic.
   */
  async createForPayment(
    tx: Prisma.TransactionClient,
    args: {
      subscriptionId: string;
      businessId: string;
      amount: number;
      plan: string;
      billingCycle: string;
    },
  ) {
    const invoiceNumber = await nextInvoiceNumber();
    const { items, subtotal, tax, total } = buildLineItems({
      plan: args.plan,
      billingCycle: args.billingCycle,
      amount: args.amount,
    });
    return tx.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId: args.subscriptionId,
        businessId: args.businessId,
        amount: subtotal,
        tax,
        totalAmount: total,
        currency: 'BDT',
        status: 'PAID',
        dueDate: new Date(),
        paidAt: new Date(),
        items: items as unknown as Prisma.InputJsonValue,
      },
    });
  },

  /**
   * Render an invoice PDF. Uploads to S3 when configured, otherwise returns
   * a Buffer that the caller can stream to the client.
   */
  async renderPdf(invoiceId: string): Promise<{ buffer: Buffer; invoice: Awaited<ReturnType<typeof prisma.invoice.findUniqueOrThrow>> }> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        business: { select: { displayName: true, legalName: true, email: true, addressLine1: true, city: true } },
        subscription: { select: { plan: true, billingCycle: true } },
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<void>((resolve) => doc.on('end', () => resolve()));

    drawHeader(doc, invoice.invoiceNumber);
    drawParties(doc, invoice);
    drawLineItems(doc, invoice);
    drawTotals(doc, invoice);
    drawFooter(doc);

    doc.end();
    await done;
    const buffer = Buffer.concat(chunks);
    return { buffer, invoice };
  },

  /**
   * Stream a PDF directly to the client. Use this when S3 is not configured.
   */
  async streamToResponse(invoiceId: string, res: Response): Promise<void> {
    const { buffer, invoice } = await this.renderPdf(invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${invoice.invoiceNumber}.pdf"`,
    );
    res.setHeader('Content-Length', String(buffer.length));
    Readable.from(buffer).pipe(res);
  },

  /**
   * Upload the rendered PDF to S3 and persist the URL on the invoice row.
   * Returns the public URL.
   */
  async uploadToStorage(invoiceId: string): Promise<string | null> {
    if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      logger.warn({ invoiceId }, 'S3 not configured — skipping invoice upload');
      return null;
    }
    const { buffer, invoice } = await this.renderPdf(invoiceId);
    const key = `${STORAGE_KEYS.PUBLIC ?? 'public'}/invoices/${invoice.invoiceNumber}.pdf`;
    const url = await storage.uploadObject({
      key,
      body: buffer,
      contentType: 'application/pdf',
      bucket: env.S3_PUBLIC_BUCKET,
    });
    await prisma.invoice.update({ where: { id: invoiceId }, data: { pdfUrl: url } });
    return url;
  },

  // ---- Reads ----

  async listForBusiness(businessId: string, opts: { page: number; perPage: number; status?: string }) {
    const where = {
      businessId,
      ...(opts.status ? { status: opts.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
      }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total };
  },

  async getForBusiness(businessId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  },

  async getById(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  },

  /**
   * Backwards-compatible helper used by routes that don't yet pass a
   * transaction client.
   */
  async generate(args: {
    subscriptionId: string;
    amount: number;
    plan: string;
    billingCycle: string;
  }) {
    const sub = await prisma.subscription.findUnique({
      where: { id: args.subscriptionId },
      select: { businessId: true },
    });
    if (!sub) throw new BadRequestError('Invalid subscription');
    return prisma.$transaction(async (tx) => {
      const invoice = await this.createForPayment(tx, {
        subscriptionId: args.subscriptionId,
        businessId: sub.businessId!,
        amount: args.amount,
        plan: args.plan,
        billingCycle: args.billingCycle,
      });
      // Fire-and-forget upload.
      this.uploadToStorage(invoice.id).catch((err) =>
        logger.error({ err, invoiceId: invoice.id }, 'Invoice S3 upload failed'),
      );
      return invoice;
    });
  },
};

export default invoiceService;

// ---- PDF drawing helpers ----

function drawHeader(doc: PDFKit.PDFDocument, invoiceNumber: string): void {
  doc
    .fontSize(24)
    .fillColor('#111827')
    .text('Credible', { align: 'left' })
    .fontSize(10)
    .fillColor('#6B7280')
    .text('Bangladesh trust & verification platform')
    .text('support@credible.example')
    .moveUp(2);
  doc
    .fontSize(22)
    .fillColor('#1A56DB')
    .text('INVOICE', { align: 'right' })
    .fontSize(10)
    .fillColor('#374151')
    .text(invoiceNumber, { align: 'right' });
  doc.moveDown(2);
}

interface PartyData {
  invoiceNumber: string;
  business: {
    displayName: string;
    legalName?: string | null;
    email?: string | null;
    addressLine1?: string | null;
    city?: string | null;
  };
  createdAt: Date;
  dueDate: Date;
  paidAt: Date | null;
}

function drawParties(doc: PDFKit.PDFDocument, invoice: PartyData): void {
  doc.fontSize(10).fillColor('#111827');
  doc.text('Billed to:', { continued: false });
  doc.fontSize(9).fillColor('#374151');
  doc.text(invoice.business.legalName ?? invoice.business.displayName);
  if (invoice.business.email) doc.text(invoice.business.email);
  if (invoice.business.addressLine1) doc.text(invoice.business.addressLine1);
  if (invoice.business.city) doc.text(invoice.business.city);
  doc.moveDown(1);
  doc.fontSize(9);
  doc.text(`Invoice date: ${invoice.createdAt.toLocaleDateString('en-GB')}`);
  doc.text(`Due date:    ${invoice.dueDate.toLocaleDateString('en-GB')}`);
  if (invoice.paidAt) doc.fillColor('#059669').text(`Paid:        ${invoice.paidAt.toLocaleDateString('en-GB')}`);
  doc.moveDown(1);
}

interface ItemsData {
  items: unknown;
  amount: { toString: () => string };
  tax: { toString: () => string };
  totalAmount: { toString: () => string };
  currency: string;
}

function drawLineItems(doc: PDFKit.PDFDocument, invoice: ItemsData): void {
  const items = (invoice.items as InvoiceLineItem[]) ?? [];
  doc.fontSize(10).fillColor('#111827').text('Items', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#374151');
  items.forEach((item) => {
    const line = `${item.description}  —  ${item.quantity} × ${item.unitPrice.toFixed(2)} ${
      invoice.currency
    }  =  ${item.total.toFixed(2)} ${invoice.currency}`;
    doc.text(line);
  });
  doc.moveDown(1);
}

function drawTotals(doc: PDFKit.PDFDocument, invoice: ItemsData): void {
  const right = () => doc.text('', { align: 'right' });
  doc.fontSize(10).fillColor('#111827');
  right(); doc.text(`Subtotal: ${Number(invoice.amount).toFixed(2)} ${invoice.currency}`, { align: 'right' });
  right(); doc.text(`VAT:      ${Number(invoice.tax).toFixed(2)} ${invoice.currency}`, { align: 'right' });
  doc.fontSize(12).fillColor('#1A56DB');
  right(); doc.text(`Total:    ${Number(invoice.totalAmount).toFixed(2)} ${invoice.currency}`, { align: 'right' });
  doc.moveDown(2);
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  doc
    .fontSize(8)
    .fillColor('#6B7280')
    .text(
      'Thank you for choosing Credible. This invoice is generated automatically and is valid without signature.',
      { align: 'center' },
    );
}