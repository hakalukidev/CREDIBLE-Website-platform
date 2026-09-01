'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminPayment,
  useRefundPayment,
} from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data: payment, isLoading } = useAdminPayment(id);
  const refund = useRefundPayment();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  if (isLoading || !payment) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment…
      </div>
    );
  }

  const onRefund = async () => {
    await refund.mutateAsync({
      id,
      amount: amount ? Number(amount) : undefined,
      reason,
    });
    setAmount('');
    setReason('');
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Payment {payment.id.slice(0, 8)}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(payment.createdAt)} · {payment.gateway}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Field label="Amount" value={`${Number(payment.amount).toLocaleString()} ${payment.currency}`} />
          <Field label="Status" value={payment.status} />
          <Field label="Paid at" value={payment.paidAt ? formatDate(payment.paidAt) : '—'} />
          <Field
            label="Payer"
            value={payment.user ? `${payment.user.email}` : '—'}
          />
          <Field
            label="Business"
            value={
              payment.business ? (
                <Link className="underline" href={`/admin/businesses/${payment.business.id}`}>
                  {payment.business.displayName}
                </Link>
              ) : (
                '—'
              )
            }
          />
          <Field
            label="Professional"
            value={
              payment.professional ? (
                <Link className="underline" href={`/admin/professionals/${payment.professional.id}`}>
                  {payment.professional.displayName}
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
          <CardTitle>Refund</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="number"
            placeholder="Amount (optional, defaults to remaining)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder="Reason (required, ≥ 5 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={onRefund} disabled={reason.length < 5 || refund.isPending}>
            Issue refund
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