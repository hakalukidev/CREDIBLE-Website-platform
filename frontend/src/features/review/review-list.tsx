'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';

interface ReviewListProps {
  businessId: string;
}

export function ReviewList({ businessId }: ReviewListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk.reviews.list(businessId, page),
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: ReviewItemModel[];
        meta?: { totalPages: number };
      }>(`/businesses/${businessId}/reviews?page=${page}&perPage=10`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <FriendlyError kind="reviews" variant="inline" />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first to share your experience.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.data.map((r) => (
        <ReviewItem key={r.id} review={r} viewer="PUBLIC" />
      ))}

      {data.meta && data.meta.totalPages > 1 && (
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
    </div>
  );
}