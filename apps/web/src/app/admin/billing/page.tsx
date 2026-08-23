'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  useAdminBillingStats,
  useAdminPayments,
  useAdminSubscriptions,
} from '@/features/billing/subscription-hooks';
import { formatDate, formatRelative } from '@/lib/utils';
import { PLAN_DISPLAY } from '@credible/shared';
import { Loader2, Banknote, Users, ReceiptText, Tag } from 'lucide-react';

export default function AdminBillingOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminBillingStats();
  const { data: paymentsData, isLoading: paymentsLoading } = useAdminPayments({ page: 1, perPage: 10 });
  const { data: subsData, isLoading: subsLoading } = useAdminSubscriptions({ page: 1, perPage: 10 });

  if (statsLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing overview…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Billing &amp; subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Monitor revenue, active subscriptions and recent payments.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi
          icon={<Banknote className="h-5 w-5" />}
          label="Total revenue"
          value={`${(stats?.totalRevenue ?? 0).toLocaleString()} BDT`}
          hint={`${stats?.totalSuccessfulPayments ?? 0} successful payments`}
        />
        <Kpi
          icon={<ReceiptText className="h-5 w-5" />}
          label="This month"
          value={`${(stats?.monthlyRevenue ?? 0).toLocaleString()} BDT`}
          hint="since 1st of this month"
        />
        <Kpi
          icon={<Users className="h-5 w-5" />}
          label="Active subscriptions"
          value={
            stats
              ? Object.entries(stats.subscriptionCount)
                  .reduce((sum, [, v]) => sum + (v ?? 0), 0)
                  .toLocaleString()
              : '0'
          }
          hint={
            stats
              ? Object.entries(stats.subscriptionCount)
                  .map(([plan, count]) => `${PLAN_DISPLAY[plan as keyof typeof PLAN_DISPLAY] ?? plan}: ${count}`)
                  .join(' · ')
              : ''
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/billing/payments"
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          All payments
        </Link>
        <Link
          href="/admin/billing/subscriptions"
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          All subscriptions
        </Link>
        <Link
          href="/admin/billing/vouchers"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          <Tag className="h-4 w-4" /> Manage vouchers
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
          <CardDescription>Last 10 successful charges.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : paymentsData?.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Business</th>
                    <th className="py-2">Gateway</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.data.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 text-muted-foreground">
                        {p.paidAt ? formatRelative(p.paidAt) : formatDate(p.createdAt)}
                      </td>
                      <td className="py-2 font-medium">{p.business?.displayName ?? '—'}</td>
                      <td className="py-2">{p.gateway}</td>
                      <td className="py-2">
                        {Number(p.amount).toLocaleString()} {p.currency}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent subscriptions</CardTitle>
          <CardDescription>Last 10 subscription records.</CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : subsData && Array.isArray(subsData.data) && subsData.data.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Business</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {(subsData.data as Array<{
                    id: string;
                    plan: string;
                    status: string;
                    billingCycle: string | null;
                    business: { displayName: string } | null;
                  }>).map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 font-medium">{s.business?.displayName ?? '—'}</td>
                      <td className="py-2">{PLAN_DISPLAY[s.plan as keyof typeof PLAN_DISPLAY] ?? s.plan}</td>
                      <td className="py-2">{s.status}</td>
                      <td className="py-2">{s.billingCycle?.toLowerCase() ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'SUCCESS'
      ? 'bg-success/10 text-success'
      : status === 'PENDING'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-destructive/10 text-destructive';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  );
}