'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import { ReviewResponseForm } from '@/components/business/review-response-form';
import { ReportReviewModal } from '@/components/business/report-review-modal';

type SortKey = 'createdAt' | 'rating' | 'helpfulCount';
type SortOrder = 'asc' | 'desc';

export function OwnerReviewsList() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [minRating, setMinRating] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [respondTo, setRespondTo] = useState<ReviewItemModel | null>(null);
  const [reportReview, setReportReview] = useState<ReviewItemModel | null>(null);

  const filters = { sortBy, sortOrder, minRating, search: search.trim() || undefined };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk.reviews.owner(page, perPage, filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        sortBy,
        sortOrder,
      });
      if (minRating) params.set('minRating', String(minRating));
      if (search.trim()) params.set('search', search.trim());
      const res = await apiClient.get<{
        success: true;
        data: ReviewItemModel[];
        meta?: { totalPages: number };
      }>(`/businesses/me/reviews?${params.toString()}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Search reviews by content or author"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Min rating:</span>
              {[1, 2, 3, 4, 5].map((r) => (
                <Button
                  key={r}
                  variant={minRating === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPage(1);
                    setMinRating(minRating === r ? undefined : r);
                  }}
                >
                  {r}+
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Sort by:</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
              >
                <option value="createdAt">Date</option>
                <option value="rating">Rating</option>
                <option value="helpfulCount">Helpful</option>
              </select>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {isError && <FriendlyError kind="reviews" className="max-w-xl" />}

      {data && data.data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No reviews match your filters.
          </CardContent>
        </Card>
      )}

      {data && data.data.length > 0 && (
        <div className="space-y-3">
          {data.data.map((r) => (
            <div key={r.id}>
              <ReviewItem
                review={r}
                viewer="OWNER"
                onRespond={(review) => setRespondTo(review)}
                onReport={(review) => setReportReview(review)}
              />
              {respondTo?.id === r.id && (
                <ReviewResponseForm
                  reviewId={r.id}
                  onSuccess={() => setRespondTo(null)}
                  onCancel={() => setRespondTo(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page {page} of {data.meta.totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ReportReviewModal
        reviewId={reportReview?.id ?? ''}
        open={Boolean(reportReview)}
        onOpenChange={(o) => !o && setReportReview(null)}
      />
    </div>
  );
}