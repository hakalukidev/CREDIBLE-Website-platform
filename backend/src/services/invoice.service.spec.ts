import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findFirstMock, createMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    INVOICE_VAT_RATE: 0.05,
    S3_REGION: 'auto',
    S3_BUCKET: 'credible-documents',
    S3_PUBLIC_BUCKET: 'credible-public',
  },
  isDev: false,
  isProd: false,
  isTest: true,
}));
vi.mock('../lib/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../lib/storage/s3', () => ({
  storage: { uploadObject: vi.fn() },
}));

vi.mock('../lib/db/prisma', () => ({
  prisma: {
    invoice: { findFirst: findFirstMock, create: createMock },
  },
}));

import { invoiceService } from './invoiceService';

beforeEach(() => {
  findFirstMock.mockReset();
  createMock.mockReset();
});

describe('invoiceService.createForPayment', () => {
  it('builds line items, VAT, and sequential invoice numbers', async () => {
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      invoiceNumber: 'INV-2026-0001',
      amount: 1000,
      tax: 50,
      totalAmount: 1050,
    });

    const result = await invoiceService.createForPayment(
      { invoice: { create: createMock } } as never,
      {
        subscriptionId: 'sub1',
        businessId: 'biz1',
        amount: 1000,
        plan: 'BASIC',
        billingCycle: 'MONTHLY',
      },
    );

    expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(createMock).toHaveBeenCalledTimes(1);
    const args = createMock.mock.calls[0][0];
    expect(args.data.amount).toBe(1000);
    expect(args.data.tax).toBe(50);
    expect(args.data.totalAmount).toBe(1050);
    expect(args.data.status).toBe('PAID');
    expect(JSON.parse(JSON.stringify(args.data.items))).toEqual([
      expect.objectContaining({ description: expect.stringContaining('BASIC') }),
      expect.objectContaining({ description: expect.stringContaining('VAT') }),
    ]);
  });

  it('increments sequence based on the latest invoice in the same year', async () => {
    findFirstMock.mockResolvedValue({ invoiceNumber: `INV-${new Date().getFullYear()}-0042` });
    createMock.mockResolvedValue({});

    await invoiceService.createForPayment(
      { invoice: { create: createMock } } as never,
      {
        subscriptionId: 'sub2',
        businessId: 'biz2',
        amount: 500,
        plan: 'PROFESSIONAL',
        billingCycle: 'YEARLY',
      },
    );

    const args = createMock.mock.calls[0][0];
    expect(args.data.invoiceNumber).toBe(`INV-${new Date().getFullYear()}-0043`);
  });
});
