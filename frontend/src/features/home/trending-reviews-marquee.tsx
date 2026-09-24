'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { initials as buildInitials } from '@credible/shared';
import { MotionSection } from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import {
  unwrapReviewsListEnvelope,
  type ReviewItemModel,
} from '@/components/business/review-item';
import { useFeaturedBusinesses } from './use-featured-businesses';

interface Review {
  id: string;
  name: string;
  initials: string;
  rating: number;
  body: string;
  business: string;
  hue: string;
}

const HUES = [
  'from-primary/20 to-primary/5',
  'from-gold-200 to-gold-50',
  'from-brand-300/30 to-brand-100/40',
  'from-primary/15 to-gold-100',
  'from-gold-200/60 to-primary/10',
  'from-brand-200/50 to-gold-100',
  'from-primary/15 to-brand-100',
  'from-gold-100 to-primary/10',
];

const MAX_DISPLAY_NAME_LEN = 24;

function pickHue(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return HUES[hash % HUES.length];
}

function displayNameFrom(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = firstName?.trim() ?? '';
  const last = lastName?.trim() ?? '';
  const full = [first, last].filter(Boolean).join(' ');
  if (!full) return 'Anonymous';
  return full.length > MAX_DISPLAY_NAME_LEN
    ? `${full.slice(0, MAX_DISPLAY_NAME_LEN - 1).trimEnd()}.`
    : full;
}

function normalizeReview(
  raw: ReviewItemModel,
  businessName: string,
): Review {
  const author = raw.user;
  return {
    id: raw.id,
    name: displayNameFrom(author?.firstName, author?.lastName),
    initials: buildInitials(author?.firstName, author?.lastName),
    rating: Math.max(0, Math.min(5, Math.round(raw.rating))),
    body: raw.content,
    business: businessName,
    hue: pickHue(raw.id),
  };
}

async function fetchRecentReviewForBusiness(
  businessId: string,
): Promise<ReviewItemModel | null> {
  try {
    const res = await apiClient.get<unknown>(
      `/businesses/${businessId}/reviews?perPage=1&sortBy=createdAt&sortOrder=desc`,
    );
    const { items } = unwrapReviewsListEnvelope(
      (res.data as { data?: unknown }).data ?? {},
    );
    return items[0] ?? null;
  } catch {
    return null;
  }
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className={cn(
        'flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card',
      )}
    >
      <Quote className="h-5 w-5 text-gold-500/70" aria-hidden />
      <p className="text-sm leading-relaxed text-foreground">“{review.body}”</p>

      <div className="mt-auto flex items-center gap-3 border-t border-border/60 pt-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-foreground ring-1 ring-border/60',
            review.hue,
          )}
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{review.name}</p>
          <p className="truncate text-xs text-muted-foreground">{review.business}</p>
        </div>
        <div className="flex items-center gap-0.5" aria-label={`Rated ${review.rating} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-3 w-3',
                i < review.rating ? 'fill-gold-500 text-gold-500' : 'fill-muted text-muted',
              )}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TrendingReviewsMarqueeProps {
  /** How many top-rated verified businesses to sample for reviews. */
  businessLimit?: number;
}

export function TrendingReviewsMarquee({
  businessLimit = 12,
}: TrendingReviewsMarqueeProps = {}) {
  const { items: businesses } = useFeaturedBusinesses(businessLimit);
  const [reviews, setReviews] = useState<Review[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    const seq = ++seqRef.current;

    (async () => {
      const settled = await Promise.all(
        businesses.map((b) => fetchRecentReviewForBusiness(b.id)),
      );
      if (seq !== seqRef.current) return;

      const collected: Review[] = [];
      for (let i = 0; i < settled.length; i++) {
        const review = settled[i];
        if (!review) continue;
        collected.push(normalizeReview(review, businesses[i].displayName));
      }
      setReviews(collected);
    })();
  }, [businesses]);

  const row = useMemo(() => [...reviews, ...reviews], [reviews]);

  return (
    <MotionSection className="border-y border-border/60 bg-muted/20">
      <div className="container-wide py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Trending reviews
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What people are saying right now.
          </h2>
        </div>

        <div
          className="group relative mt-10 overflow-hidden"
          style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' } as React.CSSProperties}
        >
          <div
            className="flex w-max gap-4 animate-marquee will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none"
            style={{ animationDuration: '45s' }}
          >
            {row.map((r, i) => (
              <ReviewCard key={`${r.id}-${i}`} review={r} />
            ))}
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
