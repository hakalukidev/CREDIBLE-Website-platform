'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotionSection } from '@/components/ui/motion-primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import { useBestInCategory, type BestInRow } from './use-best-in-category';
import type { FeaturedItem } from './use-featured-businesses';

const SKELETON_PLACEHOLDER_ROWS = 3;
const SKELETON_CARDS_PER_ROW = 6;

function ratingFromString(raw: string | null): number {
  if (raw === null) return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function locationString(item: FeaturedItem): string | null {
  const parts = [item.city, item.state, item.country].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(', ') : null;
}

function StarRow({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-base font-semibold tabular-nums text-foreground">
        {rating.toFixed(1)}
      </span>
      <span className="flex items-center" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            aria-hidden
            className={cn(
              'h-3.5 w-3.5 transition-colors',
              i < full
                ? 'fill-gold-500 text-gold-500'
                : i === full && half
                  ? 'fill-gold-500/60 text-gold-500'
                  : 'fill-muted text-muted',
            )}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {reviewCount.toLocaleString()}
      </span>
    </div>
  );
}

function CategoryCard({ item }: { item: FeaturedItem }) {
  const rating = ratingFromString(item.ratingAverage);
  const location = locationString(item);

  // Derive a display badge from the real verification level. NONE → no
  // badge (matching the previous "blank when no badge" behavior so card
  // heights stay uniform).
  const badge = item.verificationLevel === 'NONE' ? null : ('Verified' as const);

  const logoSrc = typeof item.logo === 'string' && item.logo.trim().length > 0 ? item.logo : null;
  const initial = (item.displayName?.charAt(0) ?? '?').toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="group relative flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-pop sm:w-72"
    >
      <Link
        href={`/business/${item.slug}`}
        aria-label={`View ${item.displayName} profile`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-2deg]">
          {logoSrc ? (
            <SafeImage
              src={logoSrc}
              alt={item.displayName}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-xl font-bold text-primary/60">{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold text-foreground">
            {item.displayName}
          </h3>
          {location && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Globe className="h-3 w-3" aria-hidden />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>
      </div>

      <StarRow rating={rating} reviewCount={item.ratingCount} />

      {/* Badge slot — always rendered to keep card heights uniform;
          "Verified" gets a primary-tinted pill, NONE renders an
          empty spacer of the same height. */}
      <div className="mt-1 h-5">
        {badge ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
            ✓ Verified
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:w-72">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
  );
}

function HorizontalScroller({ children }: { children: React.ReactNode }) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(true);

  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {showLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-pop transition-colors hover:bg-muted md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {showRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-pop transition-colors hover:bg-muted md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
      >
        {children}
      </div>
    </div>
  );
}

function CategorySkeletonRow() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <HorizontalScroller>
        {Array.from({ length: SKELETON_CARDS_PER_ROW }).map((_, i) => (
          <div key={i} className="snap-start">
            <CategoryCardSkeleton />
          </div>
        ))}
      </HorizontalScroller>
    </div>
  );
}

function CategoryRowSection({ row }: { row: BestInRow }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Best in {row.name}
        </h3>
        <Link
          href={`/browse?category=${encodeURIComponent(row.slug)}` as never}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          See more
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <HorizontalScroller>
        {row.items.map((item) => (
          <div key={item.id} className="snap-start">
            <CategoryCard item={item} />
          </div>
        ))}
      </HorizontalScroller>
    </div>
  );
}

export function BestInCategory() {
  const { rows, isLoading, hasError } = useBestInCategory();

  if (hasError) return null;

  return (
    <MotionSection className="bg-background">
      <div className="container-wide space-y-10 py-12 md:space-y-14 md:py-16">
        {isLoading
          ? Array.from({ length: SKELETON_PLACEHOLDER_ROWS }).map((_, i) => (
              <CategorySkeletonRow key={i} />
            ))
          : rows.map((row) => <CategoryRowSection key={row.id} row={row} />)}
      </div>
    </MotionSection>
  );
}
