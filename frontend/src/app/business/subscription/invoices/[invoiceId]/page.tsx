'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvoice, invoiceDownloadUrl } from '@/features/billing/subscription-hooks';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(params.invoiceId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading invoice…
      </div>
    );
  }
  if (!invoice) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Invoice not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" onClick={() => router.back()} className="self-start">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
            <CardDescription>Issued on {formatDate(invoice.createdAt)}</CardDescription>
          </div>
          <Button asChild variant="outline">
            <a href={invoiceDownloadUrl(invoice.id)} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Status" value={invoice.status} />
            <Stat label="Currency" value={invoice.currency} />
            <Stat label="Due date" value={formatDate(invoice.dueDate)} />
          </div>

          <div>
            <p className="mb-2 font-medium">Items</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{item.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right">
                      {invoice.amount.toLocaleString()} {invoice.currency}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">
                      VAT
                    </td>
                    <td className="px-3 py-2 text-right">
                      {invoice.tax.toLocaleString()} {invoice.currency}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right">
                      {invoice.totalAmount.toLocaleString()} {invoice.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Need a copy of this invoice? Use the download button above or visit the{' '}
            <Link href="/business/subscription/invoices" className="underline">
              invoice list
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}