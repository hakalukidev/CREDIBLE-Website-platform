'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvoices, invoiceDownloadUrl } from '@/features/billing/subscription-hooks';
import { formatDate } from '@/lib/utils';
import { Download, Loader2 } from 'lucide-react';

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInvoices(page, 20);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">All your past and current invoices in one place.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All invoices</CardTitle>
          <CardDescription>Click an invoice to view the breakdown or download the PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
            </div>
          ) : data?.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Invoice</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((inv) => (
                    <tr key={inv.id} className="border-t">
                      <td className="py-2 font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                      <td className="py-2">
                        {inv.totalAmount.toLocaleString()} {inv.currency}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-2 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/business/subscription/invoices/${inv.id}`}>View</Link>
                        </Button>
                        <a
                          className="ml-2 inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs"
                          href={invoiceDownloadUrl(inv.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.meta && data.meta.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>
                    Page {data.meta.page} of {data.meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'PAID'
      ? 'bg-success/10 text-success'
      : status === 'OVERDUE'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-muted text-muted-foreground';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  );
}