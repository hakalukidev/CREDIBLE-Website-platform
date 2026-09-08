'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import { ReviewResponseForm } from '@/components/business/review-response-form';
import { ReportReviewModal } from '@/components/business/report-review-modal';
import { useState } from 'react';

interface PageProps {
  params: Promise<{ reviewId: string }>;
}

export default function BusinessReviewDetailPage({ params }: PageProps) {
  const { reviewId } = use(params);
  const [responding, setResponding] = useState(false);
  const [reporting, setReporting] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk.reviews.ownerOne(reviewId),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ReviewItemModel }>(
        `/businesses/me/reviews/${reviewId}`,
      );
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/business/reviews">
          <ArrowLeft className="h-4 w-4" /> Back to reviews
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Review detail</h1>
        <p className="text-sm text-muted-foreground">
          Read the full review, respond publicly, or report it for moderation.
        </p>
      </header>

      {isLoading && <Skeleton className="h-40" />}
      {isError && <FriendlyError kind="review-edit" className="max-w-xl" />}
      {data && (
        <>
          <ReviewItem
            review={data.data}
            viewer="OWNER"
            onRespond={() => setResponding((v) => !v)}
            onReport={() => setReporting(true)}
          />
          {responding && (
            <ReviewResponseForm
              reviewId={data.data.id}
              onSuccess={() => setResponding(false)}
              onCancel={() => setResponding(false)}
            />
          )}
          <ReportReviewModal
            reviewId={data.data.id}
            open={reporting}
            onOpenChange={setReporting}
          />
        </>
      )}
    </div>
  );
}