'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import {
  ReviewItem,
  type ReviewItemModel,
  type ReviewsListEnvelope,
  unwrapReviewsListEnvelope,
} from '@/components/business/review-item';
import { RatingHistogram } from '@/components/reviews/rating-histogram';
import {
  ReviewSortSelect,
  type ReviewSortKey,
} from '@/components/reviews/review-sort-select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { FriendlyError } from '@/components/ui/friendly-error';

const PAGE_SIZE = 10;

const SORT_TO_PARAMS: Record<ReviewSortKey, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
  helpful: { sortBy: 'helpfulCount', sortOrder: 'desc' },
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  highest: { sortBy: 'rating', sortOrder: 'desc' },
  lowest: { sortBy: 'rating', sortOrder: 'asc' },
};

interface ReviewsTabProps {
  businessId: string;
}

function emptyDistribution(): number[] {
  return [0, 0, 0, 0, 0];
}

/**
 * The backend returns a 5-element array already in display order
 * (index 0 = 5-star count, index 4 = 1-star count). We accept any
 * incoming shape and coerce it into that order so the histogram
 * doesn't break if the backend contract ever shifts.
 */
function normalizeDistribution(raw: unknown): number[] {
  const fallback = emptyDistribution();
  if (!Array.isArray(raw)) return fallback;
  if (raw.length === 5 && raw.every((n) => typeof n === 'number')) {
    return raw as number[];
  }
  return fallback;
}

/**
 * Reviews tab content — owns the histogram, sort dropdown, star filter,
 * and pagination for a single business's reviews.
 *
 * Why this is a single component: the histogram must stay in sync with
 * the list, and the star-filter chip is rendered as a sibling to the
 * list. Co-locating the state in one component keeps the two surfaces
 * strictly consistent — clicking a bar always re-queries the same list,
 * and the chip always reflects the active filter.
 */
export function ReviewsTab({ businessId }: ReviewsTabProps) {
  const [sort, setSort] = React.useState<ReviewSortKey>('helpful');
  const [filter, setFilter] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);

  // Reset to page 1 whenever sort or filter changes — a filter change
  // should never render a stale page.
  React.useEffect(() => {
    setPage(1);
  }, [sort, filter]);

  // The histogram is loaded once (page=1, all stars) — the distribution
  // is a property of the business's reviews, not the current page.
  const histogramQuery = useQuery({
    queryKey: [...qk.reviews.list(businessId, 1, 100), 'histogram', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: ReviewsListEnvelope;
        meta?: { total: number };
      }>(`/businesses/${businessId}/reviews?perPage=100&sortBy=helpfulCount&sortOrder=desc`);
      const { items, total: envelopeTotal } = unwrapReviewsListEnvelope(res.data.data);
      const distribution = normalizeDistribution(res.data.data.distribution);
      const total = envelopeTotal ?? res.data.meta?.total ?? items.length;
      const average = items.length
        ? items.reduce((s, r) => s + r.rating, 0) / items.length
        : 0;
      return { distribution, total, average };
    },
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: qk.reviews.list(businessId, page, PAGE_SIZE),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(PAGE_SIZE));
      const sp = SORT_TO_PARAMS[sort];
      params.set('sortBy', sp.sortBy);
      params.set('sortOrder', sp.sortOrder);
      if (filter != null) params.set('rating', String(filter));
      const res = await apiClient.get<{
        success: true;
        data: ReviewsListEnvelope;
        meta: { page: number; perPage: number; totalPages: number; total: number };
      }>(`/businesses/${businessId}/reviews?${params.toString()}`);
      const { items } = unwrapReviewsListEnvelope(res.data.data);
      return { items, meta: res.data.meta };
    },
  });

  const onToggleFilter = (stars: number) => {
    setFilter((prev) => (prev === stars ? null : stars));
  };

  const onClearFilter = () => setFilter(null);

  return (
    <div className="space-y-6">
      {/* Histogram */}
      <Card className="p-5 sm:p-6">
        {histogramQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : histogramQuery.isError ? (
          <FriendlyError kind="reviews" variant="inline" />
        ) : (
          <RatingHistogram
            distribution={histogramQuery.data?.distribution ?? emptyDistribution()}
            average={histogramQuery.data?.average ?? 0}
            total={histogramQuery.data?.total ?? 0}
            onFilter={onToggleFilter}
            activeFilter={filter}
          />
        )}
      </Card>

      {/* Sort + filter chip row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filter != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Showing {filter}-star reviews only
              <button
                type="button"
                onClick={onClearFilter}
                className="rounded-full p-0.5 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
        <ReviewSortSelect value={sort} onChange={setSort} />
      </div>

      {/* Review list */}
      {listQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <FriendlyError kind="reviews" variant="inline" />
      ) : !listQuery.data || listQuery.data.items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {filter != null
              ? `No ${filter}-star reviews yet. Try clearing the filter.`
              : 'No reviews yet. Be the first to share your experience.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {listQuery.data.items.map((r) => (
              <ReviewItem
                key={r.id}
                review={{ ...r, businessId }}
                viewer="PUBLIC"
                businessId={businessId}
              />
            ))}
          </div>

          {listQuery.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {page} of {listQuery.data.meta.totalPages}
              </p>
              <Button
                variant="outline"
                disabled={page >= listQuery.data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
