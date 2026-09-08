'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminSubscriptions } from '@/features/billing/subscription-hooks';
import { PLAN_DISPLAY } from '@credible/shared';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/features/billing/types';

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState<SubscriptionPlan | ''>('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useAdminSubscriptions({
    page,
    perPage: 25,
    search: search || undefined,
    plan: (plan || undefined) as SubscriptionPlan | undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">All subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Audit every subscription record and identify churn candidates.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Combine to narrow the list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Search business or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={plan}
            onChange={(e) => setPlan(e.target.value as SubscriptionPlan | '')}
          >
            <option value="">Any plan</option>
            <option value="FREE">Free</option>
            <option value="BASIC">Basic</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="PAST_DUE">Past due</option>
            <option value="CANCELED">Canceled</option>
            <option value="UNPAID">Unpaid</option>
          </select>
          <button
            className="rounded-md border px-3 py-2 text-sm"
            type="button"
            onClick={() => setPage(1)}
          >
            Apply
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : data && Array.isArray(data.data) && data.data.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Business</th>
                    <th className="py-2">Owner</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Cycle</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data as Array<{
                    id: string;
                    plan: string;
                    status: string;
                    billingCycle: string | null;
                    createdAt: string;
                    business: { displayName: string } | null;
                    user: { email: string; firstName?: string | null; lastName?: string | null };
                  }>).map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 font-medium">{s.business?.displayName ?? '—'}</td>
                      <td className="py-2 text-muted-foreground">{s.user.email}</td>
                      <td className="py-2">
                        {PLAN_DISPLAY[s.plan as keyof typeof PLAN_DISPLAY] ?? s.plan}
                      </td>
                      <td className="py-2">{s.status}</td>
                      <td className="py-2">{s.billingCycle?.toLowerCase() ?? '—'}</td>
                      <td className="py-2 text-muted-foreground">{formatDate(s.createdAt)}</td>
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
                    <button
                      className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                      type="button"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subscriptions match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}