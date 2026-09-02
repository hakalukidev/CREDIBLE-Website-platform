'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlanCard } from '@/components/billing/plan-card';
import { useCurrentSubscription, usePlans } from '@/features/billing/subscription-hooks';
import { Loader2 } from 'lucide-react';

function PlansPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>(
    (search.get('cycle') as 'MONTHLY' | 'YEARLY') ?? 'MONTHLY',
  );

  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: current } = useCurrentSubscription();

  if (plansLoading || !plans) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Choose your plan</h1>
        <p className="text-sm text-muted-foreground">
          Unlock Credible Verified, advanced widgets, priority support and more.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Billing cycle</CardTitle>
          <CardDescription>Yearly billing saves up to two months.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={cycle === 'MONTHLY' ? 'default' : 'outline'}
            onClick={() => setCycle('MONTHLY')}
          >
            Monthly
          </Button>
          <Button
            variant={cycle === 'YEARLY' ? 'default' : 'outline'}
            onClick={() => setCycle('YEARLY')}
          >
            Yearly
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            currentPlan={current?.plan ?? 'FREE'}
            billingCycle={cycle}
            highlight={p.code === 'PROFESSIONAL'}
            onSelect={(plan, billingCycle) =>
              router.push(`/business/subscription/checkout?plan=${plan.code}&cycle=${billingCycle}`)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansPageInner />
    </Suspense>
  );
}
