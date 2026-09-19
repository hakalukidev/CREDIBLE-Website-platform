'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FriendlyError } from '@/components/ui/friendly-error';
import { PlanCard, type FeatureBullet } from './plan-card';
import type { PublicPlan } from './use-public-plans';

interface Props {
  plans: PublicPlan[] | null;
  isLoading: boolean;
  isError: boolean;
  highlightedPlan: PublicPlan | null;
  ctaHref: string;
  /** Tailwind grid columns for both skeleton and populated grid. */
  gridCols: string;
  /** Skeleton count to render during loading. */
  skeletonCount: number;
  features: FeatureBullet[];
}

/**
 * Marketing-page plans section — loading, error, empty, and populated
 * states. Shared between /for-business and /for-professionals so the
 * two pages stay in lockstep.
 */
export function PlansSection({
  plans,
  isLoading,
  isError,
  highlightedPlan,
  ctaHref,
  gridCols,
  skeletonCount,
  features,
}: Props) {
  if (isLoading) {
    return (
      <div className={`grid gap-4 ${gridCols}`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <FriendlyError kind="plans" className="max-w-xl" />;
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed bg-muted/40 p-6 text-center sm:p-8">
        <h3 className="font-display text-lg font-semibold">Pricing is unpublished</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our standard subscription tiers are still being finalised. Reach out and
          we&apos;ll send you a tailored quote based on your business size and verification needs.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/contact?subject=pricing">
              Request a quote <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/browse">Browse the directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isHighlighted={!!highlightedPlan && plan.id === highlightedPlan.id}
          ctaHref={ctaHref}
          features={features}
        />
      ))}
    </div>
  );
}