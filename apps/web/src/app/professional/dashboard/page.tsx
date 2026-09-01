'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import { ReviewResponseForm } from '@/components/business/review-response-form';
import { ReportReviewModal } from '@/components/business/report-review-modal';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { ArrowRight, MessageSquare, ShieldCheck, Eye } from 'lucide-react';

interface ProfessionalProfile {
  id: string;
  displayName: string;
  status: string;
  slug: string;
}

interface ProfessionalStats {
  ratingAverage: number;
  ratingCount: number;
  viewCount?: number;
}

export default function ProfessionalDashboardPage() {
  const [respondTo, setRespondTo] = useState<ReviewItemModel | null>(null);
  const [reportReview, setReportReview] = useState<ReviewItemModel | null>(null);

  const { data: profile } = useQuery({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ProfessionalProfile }>(
        '/professionals/me/profile',
      );
      return res.data.data;
    },
  });

  const { data: stats } = useQuery<ProfessionalStats | null>({
    queryKey: ['professionals', 'stats', profile?.id ?? null],
    queryFn: async () => {
      if (!profile?.slug) return null;
      try {
        const res = await apiClient.get<{ success: true; data: ProfessionalStats }>(
          `/professionals/slug/${profile.slug}`,
        );
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(profile?.slug),
  });

  const { data: recent } = useQuery({
    queryKey: ['reviews', 'professional', 'me', 1, 5],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{
          success: true;
          data: ReviewItemModel[];
        }>('/professionals/me/reviews?perPage=5');
        return res.data;
      } catch {
        return { success: true as const, data: [] as ReviewItemModel[] };
      }
    },
  });

  const ratingAvg = stats?.ratingAverage ?? 0;
  const ratingCount = stats?.ratingCount ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {profile?.displayName ?? 'Professional'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your reputation and respond to new reviews.
          </p>
        </div>
        <div className="flex gap-2">
          {profile?.slug && (
            <Button asChild variant="outline">
              <Link href={`/p/${profile.slug}`}>
                <Eye className="h-4 w-4" /> View public profile
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/professional/profile">Edit profile</Link>
          </Button>
          <Button asChild>
            <Link href="/professional/reviews">
              <MessageSquare className="h-4 w-4" /> View all reviews
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average rating</CardDescription>
            <CardTitle className="text-3xl">
              {ratingAvg ? ratingAvg.toFixed(1) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Based on {ratingCount} review{ratingCount === 1 ? '' : 's'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profile status</CardDescription>
            <CardTitle className="text-2xl capitalize">{profile?.status ?? 'Draft'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="link" className="px-0">
              <Link href="/professional/verification">
                <ShieldCheck className="h-4 w-4" /> Apply for verification
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Public page</CardDescription>
            <CardTitle className="truncate text-base font-mono">
              /p/{profile?.slug ?? 'your-slug'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Share this URL so clients can review you.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent reviews</CardTitle>
            <CardDescription>Your 5 most recent reviews.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/professional/reviews">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent && recent.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Share your profile URL to collect your first one.
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
