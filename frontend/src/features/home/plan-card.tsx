'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PublicPlan } from './use-public-plans';

interface FeatureBullet {
  /** When true, the bullet is always shown (no condition). */
  always?: boolean;
  /** Bullet is shown only when the plan matches. */
  when?: (plan: PublicPlan) => boolean;
  label: string;
}

export type { FeatureBullet };

const BUSINESS_FEATURES: FeatureBullet[] = [
  { always: true, label: 'Public profile page' },
  { when: (p) => p.hasVerification, label: 'Verified profile' },
  { when: (p) => p.hasBadge, label: 'Credible Verified badge' },
  { always: true, label: 'Customer reviews' },
  { always: true, label: 'Email notifications' },
];

const PROFESSIONAL_FEATURES: FeatureBullet[] = [
  { when: (p) => p.hasVerification, label: 'Verified profile' },
  { when: (p) => p.hasBadge, label: 'Credible badge' },
  { always: true, label: 'Public reviews' },
  { always: true, label: 'Profile analytics' },
];

function formatPrice(plan: PublicPlan): { display: string; suffix?: string } {
  if (plan.code === 'FREE') return { display: 'Free' };
  const symbol = plan.currency === 'BDT' ? '৳' : `${plan.currency} `;
  return { display: `${symbol}${plan.priceMonthly.toLocaleString()}`, suffix: '/mo' };
}

function ctaLabel(plan: PublicPlan): string {
  if (plan.code === 'FREE') return 'Start free';
  if (plan.code === 'ENTERPRISE') return 'Contact sales';
  return `Get ${plan.name}`;
}

interface Props {
  plan: PublicPlan;
  isHighlighted: boolean;
  ctaHref: string;
  features: FeatureBullet[];
}

/**
 * Single marketing-page pricing card. Shared between /for-business and
 * /for-professionals — both pages differ only in the value-prop copy,
 * the dashboard route, and the bullet set.
 */
export function PlanCard({ plan, isHighlighted, ctaHref, features }: Props) {
  const { display, suffix } = formatPrice(plan);

  return (
    <Card className={isHighlighted ? 'border-primary shadow-md' : ''}>
      <CardContent className="pt-6">
        {isHighlighted && <Badge className="mb-2">Most popular</Badge>}
        <p className="text-lg font-semibold">{plan.name}</p>
        <p className="mt-2 text-3xl font-bold">
          {display}
          {suffix && (
            <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
          )}
        </p>
        {plan.description && (
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
        )}
        <ul className="mt-4 space-y-2 text-sm">
          {features
            .filter((f) => f.always || (f.when && f.when(plan)))
            .map((f) => (
              <li key={f.label} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-success" /> {f.label}
              </li>
            ))}
        </ul>
        <Button
          className="mt-5 w-full"
          variant={isHighlighted ? 'default' : 'outline'}
          asChild
        >
          <Link href={ctaHref as never}>{ctaLabel(plan)}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { BUSINESS_FEATURES, PROFESSIONAL_FEATURES };