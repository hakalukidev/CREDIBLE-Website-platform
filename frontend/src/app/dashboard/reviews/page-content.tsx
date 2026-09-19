'use client';

// Dashboard "My Reviews" page.
//
// Lists the reviews the signed-in user has written, across both targets
// (businesses + professionals). Client-side sort + min-rating filter.
// Celebrates the numbers (total / average / best star) instead of burying
// them in the list.

import { useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MessageSquare,
  PenLine,
  Search,
  Stethoscope,
  Trophy,
  UserRound,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from '@/components/reviews/star-rating';
import { EmptyState } from '@/components/dashboard/primitives/empty-state';
import { SkeletonStack } from '@/components/dashboard/primitives/skeleton-stack';
import { PageHeader } from '@/components/dashboard/page-header';
import { IconTile } from '@/components/dashboard/primitives/icon-tile';
import { duration, easeOut } from '@/lib/animations';
import { formatRelative } from '@credible/shared';
import { cn } from '@/lib/utils';

interface UserReview {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string;
  targetType: 'BUSINESS' | 'PROFESSIONAL';
  business: { id: string; slug: string; displayName: string } | null;
  professional: { id: string; slug: string; displayName: string } | null;
}

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest rating' },
  { value: 'lowest', label: 'Lowest rating' },
];

const ENTRY_TRANSITION = {
  duration: duration.base,
  ease: easeOut,
} as const;

function targetOf(r: UserReview): { slug: string; name: string } | null {
  if (r.targetType === 'BUSINESS' && r.business) {
    return { slug: `/business/${r.business.slug}`, name: r.business.displayName };
  }
  if (r.targetType === 'PROFESSIONAL' && r.professional) {
    return { slug: `/p/${r.professional.slug}`, name: r.professional.displayName };
  }
  return null;
}

function compareBySort(a: UserReview, b: UserReview, sort: SortKey, ta: number, tb: number) {
  switch (sort) {
    case 'oldest':
      return ta - tb;
    case 'highest':
      return b.rating - a.rating || tb - ta;
    case 'lowest':
      return a.rating - b.rating || tb - ta;
    case 'newest':
    default:
      return tb - ta;
  }
}

export function DashboardReviewsContent() {
  const [sort, setSort] = useState<SortKey>('newest');
  const [minRating, setMinRating] = useState<number>(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.reviews.owner(1, 100),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: UserReview[] }>('/reviews/me');
      return res.data.data;
    },
    retry: false,
  });

  const sortedReviews = useMemo(() => {
    if (!data) return [];
    const filtered =
      minRating === 0 ? data : data.filter((r) => r.rating >= minRating);
    // Decorate-sort: parse `createdAt` once, attach, sort, then strip.
    return [...filtered]
      .map((r) => ({ r, t: new Date(r.createdAt).getTime() }))
      .sort((a, b) => compareBySort(a.r, b.r, sort, a.t, b.t))
      .map(({ r }) => r);
  }, [data, sort, minRating]);

  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;
    const total = data.length;
    const avg = data.reduce((sum, r) => sum + r.rating, 0) / total;
    const fiveStar = data.filter((r) => r.rating === 5).length;
    const businesses = data.filter((r) => r.targetType === 'BUSINESS').length;
    return { total, avg, fiveStar, businesses, professionals: total - businesses };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your activity"
        title="Reviews"
        description="Everything you've shared on Credible — filter, sort, or edit any of your reviews."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/search">
              <Search className="h-4 w-4" /> Find a business
            </Link>
          </Button>
        }
      />

      {!isLoading && !isError && summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ENTRY_TRANSITION}
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <StatCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Reviews written"
            value={summary.total}
            tone="primary"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Average rating"
            value={summary.avg.toFixed(1)}
            extra={`${summary.fiveStar} five-star`}
            tone="secondary"
          />
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Businesses"
            value={summary.businesses}
            tone="success"
          />
          <StatCard
            icon={<Stethoscope className="h-5 w-5" />}
            label="Professionals"
            value={summary.professionals}
            tone="muted"
          />
        </motion.div>
      )}

      <Card className="p-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sort:
            </span>
            <div className="inline-flex flex-wrap rounded-full border border-border/70 bg-muted/40 p-0.5">
              {SORT_OPTIONS.map((opt) => {
                const active = sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                      active
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Min rating:
            </span>
            <div className="inline-flex flex-wrap items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => {
                const active = minRating === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMinRating(n)}
                    className={cn(
                      'inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                    aria-pressed={active}
                  >
                    {n === 0 ? 'Any' : `${n}★+`}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && <SkeletonStack count={3} height="h-32" />}

        {isError && (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="Reviews are unavailable right now"
            description={friendlyMessage(error, 'reviews')}
            primaryAction={
              <Button size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No reviews yet"
            description="When you share an experience on Credible, it shows up here so you can revisit or edit it anytime."
            primaryAction={
              <Button asChild size="sm" className="gap-2">
                <Link href="/search">
                  <Search className="h-4 w-4" /> Find a business to review
                </Link>
              </Button>
            }
          />
        )}

        <AnimatePresence mode="popLayout">
          {sortedReviews.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ ...ENTRY_TRANSITION, delay: Math.min(i * 0.04, 0.3) }}
            >
              <ReviewCard review={r} />
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && !isError && data && data.length > 0 && sortedReviews.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No reviews match the current filters.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  extra,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  extra?: string;
  tone: 'primary' | 'secondary' | 'success' | 'muted';
}) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} tone={tone} size="md" className="shrink-0" />
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      {extra && <p className="mt-2 text-[11px] font-medium text-primary/70">{extra}</p>}
    </div>
  );
}

interface ReviewCardProps {
  review: UserReview;
}

function ReviewCard({ review }: ReviewCardProps) {
  const isProfessional = review.targetType === 'PROFESSIONAL';
  const target = targetOf(review);
  const name = target?.name ?? '—';

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback
              className={cn(
                'text-sm font-semibold',
                isProfessional
                  ? 'bg-violet-500/10 text-violet-600'
                  : 'bg-primary/10 text-primary',
              )}
            >
              {isProfessional ? <UserRound className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={(target?.slug ?? '#') as Route}
                className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
              >
                {name}
              </Link>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  isProfessional
                    ? 'bg-violet-500/10 text-violet-600'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {isProfessional ? 'Professional' : 'Business'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <StarRating value={review.rating} />
              <span className="text-xs font-medium tabular-nums text-primary">
                {review.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatRelative(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="shrink-0 gap-2 text-primary"
        >
          <Link href={`/account/reviews/${review.id}` as never}>
            <PenLine className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
      </div>

      <div className="px-5 pb-5">
        <div className="mt-3 space-y-2">
          {review.title && (
            <p className="text-sm font-semibold text-foreground">“{review.title}”</p>
          )}
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {review.content}
          </p>
        </div>
      </div>
    </article>
  );
}