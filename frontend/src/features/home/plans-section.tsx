'use client';

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
      <FriendlyError
        kind="plans"
        title="Plans coming soon"
        body="Pricing details are not published yet. Please check back later or contact us."
      />
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