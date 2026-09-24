'use client';

/**
 * PricingSection — premium pricing card grid rendered on
 * `/for-business` and `/for-professionals`.
 *
 * Data is fetched live from the public `GET /plans` endpoint via
 * `usePublicPlans`. Admin-edited prices, highlights, and audience
 * filters reflect on both marketing pages within the API's
 * `Cache-Control: max-age=300` window — admins see updates
 * immediately after a hard-refresh.
 */

import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck, Sparkles, Star } from 'lucide-react';

import { usePublicPlans, type PublicPlan } from '@/features/home/use-public-plans';
import { useSession } from '@/lib/store/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MotionCardStagger,
  MotionCardReveal,
} from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';

export type PricingAudience = 'business' | 'professional';

export interface PricingSectionProps {
  audience: PricingAudience;
  eyebrow?: string;
  headline: string;
  subtitle?: string;
  /** Plan code that should carry the "Most popular" highlight. */
  popularCode?: string;
  /** Optional anchor id so other sections can deep-link here. */
  id?: string;
}

/**
 * Cheap rule: a FREE row with zero price and no admin copy shouldn't
 * occupy a slot in the marketing grid. Admins can still surface it by
 * adding a description and/or pricing — or by setting its `audience`.
 */
function isSkippableFreePlan(plan: PublicPlan, hasPaidAlt: boolean): boolean {
  return (
    plan.code === 'FREE' &&
    hasPaidAlt &&
    plan.priceYearly === 0 &&
    (!plan.description || plan.description.trim() === '') &&
    plan.highlights.length === 0
  );
}

export function PricingSection({
  audience,
  eyebrow = 'Pricing',
  headline,
  subtitle,
  popularCode,
  id,
}: PricingSectionProps) {
  const { plans, isLoading, isError } = usePublicPlans();
  const session = useSession((s) => s.session);

  // Filter to plans meant for this audience. `ALL` shows everywhere.
  const filtered = (plans ?? [])
    .filter((p) => p.audience === 'ALL' || p.audience === audience.toUpperCase())
    .sort((a, b) => Number(a.priceYearly) - Number(b.priceYearly));

  const hasPaidAlt = filtered.some((p) => p.priceYearly > 0);
  const visible = filtered.filter((p) => !isSkippableFreePlan(p, hasPaidAlt));

  // Pick the highlighted plan: explicit `popularCode` first, then the
  // middle plan by price, so the card that visually pops in the grid
  // is the most "average" choice.
  const highlightCode =
    popularCode ?? visible[Math.floor(visible.length / 2)]?.code;

  return (
    <section
      id={id}
      className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-background via-muted/10 to-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--gold)/0.06),transparent)]"
      />

      <div className="container-wide relative py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" aria-hidden />
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {headline}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-12">
          {isLoading ? (
            <PricingSkeleton />
          ) : isError || visible.length === 0 ? (
            <PricingEmpty />
          ) : (
            <MotionCardStagger className="grid items-stretch gap-5 md:grid-cols-3">
              {visible.map((plan) => (
                <MotionCardReveal key={plan.id}>
                  <PricingCard
                    plan={plan}
                    highlighted={plan.code === highlightCode}
                    ctaHref={ctaHrefFor(session)}
                  />
                </MotionCardReveal>
              ))}
            </MotionCardStagger>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span>All plans include a 7-day free trial · cancel anytime · human-reviewed.</span>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Card
// -----------------------------------------------------------------------------

interface PricingCardProps {
  plan: PublicPlan;
  highlighted: boolean;
  ctaHref: string;
}

function PricingCard({ plan, highlighted, ctaHref }: PricingCardProps) {
  const bullets = plan.highlights.length
    ? plan.highlights
    : defaultHighlightsFor(plan);

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col gap-5 p-6 transition-all',
        highlighted
          ? 'border-2 border-gold-300 bg-gold-grad shadow-ring-gold md:-translate-y-2'
          : 'border-border/70 bg-card shadow-card hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop',
      )}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gold-300 bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-700 shadow-sm">
          <Star className="h-3 w-3 fill-current" aria-hidden />
          Most popular
        </span>
      ) : null}

      <header className="space-y-1.5">
        <p
          className={cn(
            'font-display text-sm font-semibold uppercase tracking-wider',
            highlighted ? 'text-gold-700' : 'text-muted-foreground',
          )}
        >
          {plan.name}
        </p>
        {plan.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        ) : null}
      </header>

      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-display text-4xl font-bold tracking-tight',
            highlighted
              ? 'bg-gradient-to-r from-primary via-brand-500 to-gold-600 bg-clip-text text-transparent'
              : 'text-foreground',
          )}
        >
          {formatCurrency(plan.priceYearly, plan.currency)}
        </span>
        <span className="text-sm font-medium text-muted-foreground">/ year</span>
      </div>

      <ul className="flex-1 space-y-2.5">
        {bullets.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                highlighted ? 'bg-gold-200 text-gold-700' : 'bg-primary/10 text-primary',
              )}
            >
              <Check className="h-2.5 w-2.5" aria-hidden />
            </span>
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        className={cn(
          'h-11 w-full rounded-full gap-1.5',
          highlighted
            ? 'bg-gold text-gold-foreground shadow-ring-gold hover:bg-gold/90'
            : '',
        )}
      >
        <Link href={ctaHref as never}>
          {plan.ctaLabel ?? 'Get started'}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </Button>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Sub-states
// -----------------------------------------------------------------------------

function PricingSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="flex h-full flex-col gap-5 p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
            <Skeleton className="h-3 w-3/6" />
          </div>
          <Skeleton className="h-11 w-full rounded-full" />
        </Card>
      ))}
    </div>
  );
}

function PricingEmpty() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-display text-lg font-semibold">
        Pricing is being updated
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Check back soon — we are configuring plans for this audience.
      </p>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  const code = (currency || 'USD').toUpperCase();
  // `Intl.NumberFormat` handles locale formatting; for the marketing
  // hero we want a punchy `USD 99` or `$99` look. Use the symbol
  // when we recognise it, otherwise fall back to the ISO code prefix.
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}

function ctaHrefFor(session: { user?: { username?: string | null; id?: string } } | null): string {
  if (session?.user) {
    return `/profile/${session.user.username ?? session.user.id ?? ''}`;
  }
  return '/register?next=/profile';
}

function defaultHighlightsFor(plan: PublicPlan): string[] {
  // Sensible baseline when admin hasn't supplied `highlights`. Mirrors
  // the boolean flags returned by the API so the card stays honest
  // even when the admin is lazy.
  const out: string[] = ['Public profile page'];
  if (plan.hasVerification) out.push('Human-reviewed application');
  out.push('Verified reviews', 'Two-way review replies');
  if (plan.hasBadge) out.push('Verified badge + shareable assets');
  out.push('Analytics dashboard');
  return out;
}
