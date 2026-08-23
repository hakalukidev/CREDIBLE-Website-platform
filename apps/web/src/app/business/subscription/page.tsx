'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UsageMetersCard } from '@/components/billing/usage-meter';
import {
  useCancelSubscription,
  useCurrentSubscription,
  useInvoices,
  usePaymentHistory,
  useReactivateSubscription,
} from '@/features/billing/subscription-hooks';
import { formatDate, formatRelative } from '@/lib/utils';
import { PLAN_DISPLAY } from '@credible/shared';
import { AlertCircle, ArrowUpCircle, FileText, Receipt, ShieldCheck } from 'lucide-react';

export default function BusinessSubscriptionPage() {
  const { data, isLoading, error } = useCurrentSubscription();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const { data: invoicesData } = useInvoices(1, 5);
  const { data: paymentsData } = usePaymentHistory(1, 5);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading subscription…</p>;
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">
          Could not load your subscription. Please try again later.
        </CardContent>
      </Card>
    );
  }

  const sub = data;
  const planLabel = PLAN_DISPLAY[sub.plan];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
          <p className="text-sm text-muted-foreground">
            Manage your plan, billing and invoices.
          </p>
        </div>
        {sub.plan !== 'ENTERPRISE' && (
          <Button asChild>
            <Link href="/business/subscription/plans">
              <ArrowUpCircle className="h-4 w-4" /> Upgrade plan
            </Link>
          </Button>
        )}
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Current plan: {planLabel}
            </CardTitle>
            <CardDescription>
              Status: <span className="font-medium">{sub.status}</span>
              {sub.billingCycle && (
                <>
                  {' · '}
                  <span>{(sub.billingCycle ?? '').toLowerCase()} billing</span>
                </>
              )}
              {sub.nextPaymentDate && sub.autoRenew && (
                <>
                  {' · renews '}
                  <span className="font-medium">{formatDate(sub.nextPaymentDate)}</span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="text-right text-sm">
            {sub.amount !== null && (
              <p>
                <span className="text-2xl font-semibold">{sub.amount.toLocaleString()}</span>{' '}
                <span className="text-muted-foreground">{sub.currency}</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <Stat label="Period start" value={formatDate(sub.currentPeriodStart)} />
            <Stat label="Period end" value={formatDate(sub.currentPeriodEnd)} />
            <Stat label="Auto-renew" value={sub.autoRenew ? 'Enabled' : 'Disabled'} />
            <Stat
              label="Cancel at period end"
              value={sub.cancelAtPeriodEnd ? 'Yes' : 'No'}
            />
          </div>

          {sub.cancelAtPeriodEnd && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertCircle className="h-4 w-4" />
              Your subscription is set to cancel at the end of the current period.
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                disabled={reactivate.isPending}
                onClick={() => reactivate.mutate()}
              >
                Reactivate
              </Button>
            </div>
          )}

          {!sub.cancelAtPeriodEnd && sub.plan !== 'FREE' && (
            <div className="mt-4 flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Need to cancel? Your access continues until {formatDate(sub.currentPeriodEnd)}.</span>
              <CancelInline onCancel={(reason) => cancel.mutate({ immediate: false, reason })} />
            </div>
          )}
        </CardContent>
      </Card>

      <UsageMetersCard
        month={sub.usage.month}
        metrics={[
          {
            label: 'Review invitations',
            used: sub.usage.reviewInvitations,
            limit: sub.usage.limit,
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              Recent invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoicesData?.data?.length ? (
              invoicesData.data.slice(0, 5).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/business/subscription/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-md border p-2 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</p>
                  </div>
                  <span>
                    {inv.totalAmount.toLocaleString()} {inv.currency}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground">No invoices yet.</p>
            )}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/business/subscription/invoices">View all invoices</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Recent payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {paymentsData?.data?.length ? (
              paymentsData.data.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <p className="font-medium">
                      {p.amount.toLocaleString()} {p.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.gateway} · {formatRelative(p.createdAt)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No payment history yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />
      <p className="text-center text-xs text-muted-foreground">
        Need help? Email{' '}
        <a className="underline" href="mailto:support@credible.example">
          support@credible.example
        </a>{' '}
        and our team will get back within 24 hours.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function CancelInline({ onCancel }: { onCancel: (reason?: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');

  if (!showForm) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
        Cancel subscription
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="rounded-md border px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
          Keep
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            onCancel(reason || undefined);
            setShowForm(false);
          }}
        >
          Confirm cancel
        </Button>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'SUCCESS'
      ? 'bg-success/10 text-success'
      : status === 'PENDING'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-destructive/10 text-destructive';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${variant}`}>{status}</span>
  );
}