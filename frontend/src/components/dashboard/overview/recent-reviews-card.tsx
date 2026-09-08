'use client';

/**
 * Recent-reviews section card for the dashboard Overview.
 *
 * Renders a `SectionCard` with header + the user's most recent reviews
 * (or an `EmptyState` when none). Each row uses the existing `IconTile`
 * primitive and a small star-rating chip so the list feels consistent
 * with the rest of the dashboard.
 *
 * Animations are subtle — staggered fade-up entrance, no bouncing.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Search } from 'lucide-react';
import { SectionCard, SectionCardHeader } from '../primitives/section-card';
import { IconTile } from '../primitives/icon-tile';
import { EmptyState } from '../primitives/empty-state';
import { SkeletonStack } from '../primitives/skeleton-stack';
import { Button } from '@/components/ui/button';
import { duration, easeOut } from '@/lib/animations';
import { formatRelative, pluralize } from '@credible/shared';
import { cn } from '@/lib/utils';

export interface RecentReview {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string;
  business: { id: string; slug: string; displayName: string };
}

interface RecentReviewsCardProps {
  reviews: RecentReview[];
  isLoading: boolean;
  className?: string;
  /** Maximum number of rows to show (defaults to 5). */
  limit?: number;
}

const ROW_TRANSITION = { duration: duration.base, ease: easeOut } as const;

function StarRating({ value }: { value: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <span
      aria-label={`Rated ${clamped} out of 5`}
      className="inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary-foreground"
    >
      <Star className="h-3 w-3 fill-current" aria-hidden />
      {clamped}.0
    </span>
  );
}

export function RecentReviewsCard({
  reviews,
  isLoading,
  className,
  limit = 5,
}: RecentReviewsCardProps) {
  const items = reviews.slice(0, limit);
  const total = reviews.length;

  return (
    <SectionCard className={cn('h-full p-0', className)}>
      <SectionCardHeader
        eyebrow="Activity"
        title="Recent reviews"
        description="The latest reviews you've authored across Credible."
        action={
          <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
            <Link href={'/dashboard/reviews' as never}>View all</Link>
          </Button>
        }
        className="border-b border-border/60 px-6 pb-4 pt-6"
      />

      <div className="px-2 pb-2 pt-2 sm:px-3">
        {isLoading && items.length === 0 ? (
          <div className="px-4 py-3">
            <SkeletonStack count={3} height="h-16" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No reviews yet"
            description="You haven't written any reviews on Credible. Find a business to share your experience."
            tone="muted"
            className="m-4"
            primaryAction={
              <Button asChild size="sm" className="gap-2">
                <Link href={'/search' as never}>
                  <Search className="h-4 w-4" /> Find a business
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...ROW_TRANSITION, delay: i * 0.04 }}
                className="group"
              >
                <Link
                  href={`/business/${r.business.slug}` as never}
                  className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <IconTile
                    icon={<MessageSquare className="h-4 w-4" />}
                    tone="secondary"
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.business.displayName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {r.title?.trim() || r.content}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRating value={r.rating} />
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelative(r.createdAt)}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {!isLoading && total > limit && (
        <div className="border-t border-border/60 px-6 py-3 text-center text-xs text-muted-foreground">
          Showing {limit} of {total} {pluralize(total, 'review')}
        </div>
      )}
    </SectionCard>
  );
}
