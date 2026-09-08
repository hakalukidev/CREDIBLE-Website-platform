'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminPayments } from '@/features/billing/subscription-hooks';
import { formatDate, formatRelative } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gateway, setGateway] = useState('');

  const { data, isLoading } = useAdminPayments({
    page,
    perPage: 25,
    search: search || undefined,
    status: status || undefined,
    gateway: gateway || undefined,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">All payments</h1>
        <p className="text-sm text-muted-foreground">
          Filter, search and audit every payment record.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Combine filters to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Search txn id or business"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
          >
            <option value="">Any gateway</option>
            <option value="AAMARPAY">aamarPay</option>
            <option value="SSLCOMMERZ">SSLCommerz</option>
            <option value="MANUAL">Manual</option>
          </select>
          <Button onClick={() => setPage(1)}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
            </div>
          ) : data?.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Business</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Gateway</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Txn ID</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 text-muted-foreground">
                        {p.paidAt ? formatRelative(p.paidAt) : formatDate(p.createdAt)}
                      </td>
                      <td className="py-2 font-medium">{p.business?.displayName ?? '—'}</td>
                      <td className="py-2">{p.subscription?.plan ?? '—'}</td>
                      <td className="py-2">{p.gateway}</td>
                      <td className="py-2">
                        {Number(p.amount).toLocaleString()} {p.currency}
                      </td>
                      <td className="py-2">{p.status}</td>
                      <td className="py-2 font-mono text-xs">{p.gatewayTxnId ?? '—'}</td>
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
                      onClick={() => setPage((p) => p - 1)}
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
            <p className="text-sm text-muted-foreground">No payments match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}