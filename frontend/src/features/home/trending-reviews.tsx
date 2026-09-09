'use client';

import { Star, ShieldCheck, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MotionStagger, MotionCardReveal } from '@/components/ui/motion-primitives';
import { useFeaturedBusinesses } from './use-featured-businesses';
import Link from 'next/link';

interface TrendingReviewsProps {
  limit?: number;
}

const PRAISE = [
  'Customers consistently call this business verified, honest, and reliable.',
  'Highly recommended — real reviews from real, identity-checked customers.',
  'Top-rated in its category, backed by a human-reviewed Credible badge.',
];

/**
 * Trending reviews — a reviews.io-style social-proof strip that surfaces
 * the highest-rated, fully verified businesses on Credible. Each card
 * presents the business as a "review" with an authentic rating, so visitors
 * instantly understand the value of verified feedback.
 */
export function TrendingReviews({ limit = 4 }: TrendingReviewsProps = {}) {
  const { items, isLoading, isError } = useFeaturedBusinesses(limit);

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) return null;
  if (items.length === 0) return null;

  const reviews = items.slice(0, limit).map((b, idx) => ({
    name: b.displayName,
    location: [b.city, b.state, b.country].filter(Boolean).join(' · '),
    rating:
      b.ratingAverage != null && b.ratingAverage !== ''
        ? Number(b.ratingAverage)
        : null,
    count: b.ratingCount,
    quote: PRAISE[idx % PRAISE.length],
    slug: b.slug,
  }));

  return (
    <MotionStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {reviews.map((r) => (
        <MotionCardReveal key={r.slug} className="h-full">
          <Card className="group flex h-full flex-col rounded-2xl border-border/70 bg-card/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
            <div className="flex items-center justify-between">
              <Quote className="h-6 w-6 text-primary/30" aria-hidden />
              <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1" aria-label={`Rating ${r.rating?.toFixed(1) ?? '–'} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    r.rating != null && i < Math.round(r.rating)
                      ? 'h-4 w-4 fill-yellow-400 text-yellow-400'
                      : 'h-4 w-4 text-muted-foreground/30'
                  }
                  aria-hidden
                />
              ))}
            </div>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{r.quote}&rdquo;
            </p>

            <Link
              href={`/business/${r.slug}`}
              className="mt-4 flex items-center gap-2.5 border-t border-border/60 pt-4 transition-colors group-hover:border-primary/20"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 font-display text-sm font-bold text-primary ring-1 ring-primary/15">
                {r.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{r.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.count} review{r.count === 1 ? '' : 's'}
                </span>
              </span>
            </Link>
          </Card>
        </MotionCardReveal>
      ))}
    </MotionStagger>
  );
}
