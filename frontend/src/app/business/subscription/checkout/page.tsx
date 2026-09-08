'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoucherInput } from '@/components/billing/voucher-input';
import { usePlans, useSubscribe } from '@/features/billing/subscription-hooks';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { PaymentGateway, SubscriptionPlan, BillingCycle } from '@/features/billing/types';

function CheckoutPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const planId = search.get('plan') as SubscriptionPlan | null;
  const cycle = (search.get('cycle') as BillingCycle) ?? 'MONTHLY';

  const [gateway, setGateway] = useState<PaymentGateway>('AAMARPAY');
  const [voucher, setVoucher] = useState<{ code: string; discountAmount: number; discountedPrice: number } | null>(null);

  const { data: plans, isLoading } = usePlans();
  const subscribe = useSubscribe();

  const plan = plans?.find((p) => p.code === planId);

  useEffect(() => {
    if (!planId) router.replace('/business/subscription/plans');
  }, [planId, router]);

  if (isLoading || !plan) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing checkout…
      </div>
    );
  }

  const baseAmount = cycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
  const amount = voucher?.discountedPrice ?? baseAmount;
  const discount = voucher?.discountAmount ?? 0;

  const handleSubscribe = async () => {
    if (!planId) return;
    const res = await subscribe.mutateAsync({
      planId,
      billingCycle: cycle,
      gateway,
      voucherCode: voucher?.code,
    });
    // Redirect to gateway-hosted payment page.
    window.location.href = res.paymentUrl;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Confirm your subscription</h1>
        <p className="text-sm text-muted-foreground">
          Review the order, apply any voucher codes and choose how to pay.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
          <CardDescription>
            {plan.name} plan · {cycle.toLowerCase()} billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={`${plan.name} (${cycle.toLowerCase()})`} value={`${baseAmount.toLocaleString()} BDT`} />
          {discount > 0 && (
            <Row
              label={`Voucher ${voucher!.code}`}
              value={`-${discount.toLocaleString()} BDT`}
              tone="success"
            />
          )}
          <hr className="my-2" />
          <Row label="Total due" value={`${amount.toLocaleString()} BDT`} bold />
        </CardContent>
      </Card>

      <VoucherInput
        planId={plan.code}
        amount={baseAmount}
        onChange={(v) => setVoucher(v)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>We support aamarPay and SSLCommerz (cards, mobile banking).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <PaymentOption
            value="AAMARPAY"
            title="aamarPay"
            description="Cards, bKash, Nagad, Rocket, Upay"
            selected={gateway === 'AAMARPAY'}
            onSelect={() => setGateway('AAMARPAY')}
          />
          <PaymentOption
            value="SSLCOMMERZ"
            title="SSLCommerz"
            description="Cards, mobile banking, internet banking"
            selected={gateway === 'SSLCOMMERZ'}
            onSelect={() => setGateway('SSLCOMMERZ')}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-success" />
        Your card details never touch our servers. All payments are handled by the gateway.
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleSubscribe}
        disabled={subscribe.isPending}
      >
        {subscribe.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
          </>
        ) : (
          <>Pay {amount.toLocaleString()} BDT with {gateway === 'AAMARPAY' ? 'aamarPay' : 'SSLCommerz'}</>
        )}
      </Button>

      <Button variant="ghost" className="w-full" asChild>
        <a href="/business/subscription/plans">Back to plans</a>
      </Button>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary above it for static
// generation in Next.js 15+/16. The wrapper provides that boundary
// without forcing the inner component to be a server component.
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'default';
  bold?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'text-base font-semibold' : ''}`}>
      <span>{label}</span>
      <span className={tone === 'success' ? 'text-success' : undefined}>{value}</span>
    </div>
  );
}

function PaymentOption({
  value,
  title,
  description,
  selected,
  onSelect,
}: {
  value: PaymentGateway;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-md border p-4 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40'
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
