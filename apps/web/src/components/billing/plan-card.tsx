'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import type { PlanInfo, SubscriptionPlan } from '@/features/billing/types';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: PlanInfo;
  currentPlan: SubscriptionPlan;
  onSelect?: (plan: PlanInfo, cycle: 'MONTHLY' | 'YEARLY') => void;
  billingCycle: 'MONTHLY' | 'YEARLY';
  highlight?: boolean;
}

const FEATURE_LABELS: Array<{ key: keyof PlanInfo['features']; label: string }> = [
  { key: 'canList', label: 'Listed in Credible search' },
  { key: 'canCollectReviews', label: 'Collect customer reviews' },
  { key: 'canRespondReviews', label: 'Respond to reviews' },
  { key: 'canGetVerified', label: 'Apply for Credible Verified' },
  { key: 'canUseWidgets', label: 'Embed widgets on your site' },
  { key: 'canGenerateQR', label: 'QR code for review collection' },
  { key: 'canSendInvitations', label: 'Send review invitations' },
  { key: 'customDomain', label: 'Custom domain' },
  { key: 'badgeDisplay', label: 'Display Credible Verified badge' },
  { key: 'analytics', label: 'Advanced analytics' },
];

export function PlanCard({ plan, currentPlan, onSelect, billingCycle, highlight }: PlanCardProps) {
  const isCurrent = plan.code === currentPlan;
  const price = billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
  const isFree = plan.code === 'FREE';

  return (
    <Card className={cn('relative flex flex-col', highlight && 'border-primary shadow-md', isCurrent && 'border-success')}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default">Recommended</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription className="min-h-[2.5rem]">{plan.description}</CardDescription>
        <div className="mt-2">
          <span className="text-3xl font-bold">
            {isFree ? 'Free' : `${price.toLocaleString('en-US')} BDT`}
          </span>
          {!isFree && (
            <span className="ml-1 text-sm text-muted-foreground">
              /{billingCycle === 'YEARLY' ? 'year' : 'month'}
            </span>
          )}
        </div>
        {billingCycle === 'YEARLY' && !isFree && (
          <p className="text-xs text-muted-foreground">
            Equivalent to {(price / 12).toFixed(0)} BDT / month
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="space-y-2 text-sm">
          {FEATURE_LABELS.map(({ key, label }) => {
            const enabled = plan.features[key];
            return (
              <li key={key} className="flex items-center gap-2">
                {enabled ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/50" />
                )}
                <span className={cn(!enabled && 'text-muted-foreground')}>{label}</span>
              </li>
            );
          })}
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-success" />
            <span>
              {plan.features.reviewInvitationsLimit >= Number.MAX_SAFE_INTEGER
                ? 'Unlimited review invitations'
                : `${plan.features.reviewInvitationsLimit} review invitations / month`}
            </span>
          </li>
        </ul>

        <div className="mt-auto pt-4">
          {isCurrent ? (
            <Button asChild variant="outline" disabled className="w-full">
              <span>Current plan</span>
            </Button>
          ) : isFree ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/business/subscription">Stay on Free</Link>
            </Button>
          ) : onSelect ? (
            <Button
              className="w-full"
              variant={highlight ? 'default' : 'outline'}
              onClick={() => onSelect(plan, billingCycle)}
            >
              Choose {plan.name}
            </Button>
          ) : (
            <Button asChild className="w-full" variant={highlight ? 'default' : 'outline'}>
              <Link href={`/business/subscription/checkout?plan=${plan.code}&cycle=${billingCycle}`}>
                Choose {plan.name}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
