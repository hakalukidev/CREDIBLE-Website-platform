'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminSubscription,
  useCancelSubscription,
  useOverrideSubscription,
} from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminSubscriptionDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data: sub, isLoading } = useAdminSubscription(id);
  const cancel = useCancelSubscription();
  const override = useOverrideSubscription();
  const [reason, setReason] = useState('');
  const [plan, setPlan] = useState('FREE');
  const [validUntil, setValidUntil] = useState('');

  if (isLoading || !sub) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
      </div>
    );
  }

  const onCancel = async () => {
    await cancel.mutateAsync({ id, reason });
    setReason('');
  };

  const onOverride = async () => {
    await override.mutateAsync({
      id,
      plan: plan as never,
      validUntil: validUntil || undefined,
    });
    setValidUntil('');
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Subscription {sub.id.slice(0, 8)}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Field label="Plan" value={sub.plan} />
          <Field label="Status" value={sub.status} />
          <Field
            label="Owner"
            value={sub.user ? sub.user.email : '—'}
          />
          <Field
            label="Business"
            value={
              sub.business ? (
                <Link className="underline" href={`/admin/businesses/${sub.business.id}`}>
                  {sub.business.displayName}
                </Link>
              ) : (
                '—'
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cancel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <Input
            placeholder="Reason (required, ≥ 5 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            variant="destructive"
            onClick={onCancel}
            disabled={reason.length < 5 || cancel.isPending}
          >
            Cancel subscription
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Override plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PROFESSIONAL">PROFESSIONAL</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
          <Button onClick={onOverride} disabled={override.isPending}>
            Apply
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}