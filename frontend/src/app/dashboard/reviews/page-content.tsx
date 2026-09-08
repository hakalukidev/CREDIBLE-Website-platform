'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, PenLine, Search } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/reviews/star-rating';
import { EmptyState } from '@/components/dashboard/primitives/empty-state';
import { SkeletonStack } from '@/components/dashboard/primitives/skeleton-stack';
import { PageHeader } from '@/components/dashboard/page-header';
import { duration, easeOut } from '@/lib/animations';
import { formatRelative } from '@credible/shared';

interface UserReview {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string;
  business: { id: string; slug: string; displayName: string };
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk.reviews.owner(1, 100),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: UserReview[] }>(
        '/reviews/me',
      );
      return res.data.data;
    },
  });

  const sortedReviews = useMemo(() => {
    if (!data) return [];
    const filtered = minRating === 0
      ? data
      : data.filter((r) => r.rating >= minRating);
    // Decorate-sort: parse `createdAt` once, attach, sort, then strip.
    return [...filtered]
      .map((r) => ({ r, t: new Date(r.createdAt).getTime() }))
      .sort((a, b) => compareBySort(a.r, b.r, sort, a.t, b.t))
      .map(({ r }) => r);
  }, [data, sort, minRating]);

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

      <Card className="p-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sort:
            </span>
            <div className="inline-flex rounded-full border border-border/70 bg-muted/40 p-0.5">
              {SORT_OPTIONS.map((opt) => {
                const active = sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
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
            <div className="inline-flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => {
                const active = minRating === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMinRating(n)}
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
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
          <Card>
            <CardContent className="p-6 text-sm text-destructive">
              {friendlyMessage(error, 'reviews')}
            </CardContent>
          </Card>
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ ...ENTRY_TRANSITION, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="transition-shadow hover:shadow-pop">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      <Link href={`/business/${r.business.slug}` as never} className="hover:underline">
                        {r.business.displayName}
                      </Link>
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <StarRating value={r.rating} />
                      <span>•</span>
                      <span>{formatRelative(r.createdAt)}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-2 shrink-0">
                    <Link href={`/account/reviews/${r.id}` as never}>
                      <PenLine className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.title && <p className="text-sm font-semibold text-foreground">{r.title}</p>}
                  <p className="whitespace-pre-line text-sm text-muted-foreground line-clamp-4">
                    {r.content}
                  </p>
                </CardContent>
              </Card>
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
