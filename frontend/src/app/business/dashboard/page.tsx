'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardKpis } from '@/features/business/dashboard-kpis';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import { ReviewResponseForm } from '@/components/business/review-response-form';
import { ReportReviewModal } from '@/components/business/report-review-modal';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { ArrowRight, MessageSquare } from 'lucide-react';

export default function BusinessDashboardPage() {
  const [respondTo, setRespondTo] = useState<ReviewItemModel | null>(null);
  const [reportReview, setReportReview] = useState<ReviewItemModel | null>(null);

  const { data: profile } = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: { id: string; verificationStatus: string } }>(
        '/businesses/me/profile',
      );
      return res.data.data;
    },
  });

  const { data: recent } = useQuery({
    queryKey: qk.reviews.owner(1, 5, { sortBy: 'createdAt', sortOrder: 'desc' }),
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: ReviewItemModel[];
      }>('/businesses/me/reviews?perPage=5&sortBy=createdAt&sortOrder=desc');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track your reputation and respond to new reviews.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/business/profile">Edit profile</Link>
          </Button>
          <Button asChild>
            <Link href="/business/reviews">
              <MessageSquare className="h-4 w-4" /> View all reviews
            </Link>
          </Button>
        </div>
      </header>

      <DashboardKpis />

      <Card>
        <CardHeader>
          <CardTitle>Verification status</CardTitle>
          <CardDescription>
            Current level: {profile?.verificationStatus ?? 'NOT_STARTED'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Phase 3 will introduce the full Credible Verified application flow. Until
          then, all published businesses enjoy the baseline trust features.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent reviews</CardTitle>
            <CardDescription>Your 5 most recent reviews.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/business/reviews">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent && recent.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Share your review link to collect your first one.
            </p>
          )}
          {recent?.data.map((r) => (
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
        </CardContent>
      </Card>

      <ReportReviewModal
        reviewId={reportReview?.id ?? ''}
        open={Boolean(reportReview)}
        onOpenChange={(o) => !o && setReportReview(null)}
      />
    </div>
  );
}