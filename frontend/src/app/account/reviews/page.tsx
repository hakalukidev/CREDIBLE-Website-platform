'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/reviews/star-rating';
import { FriendlyError } from '@/components/ui/friendly-error';
import { apiClient } from '@/lib/api/client';
import { formatRelative } from '@credible/shared';

interface UserReview {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string;
  business: { id: string; slug: string; displayName: string };
}

export default function AccountReviewsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', 'mine'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: UserReview[] }>(`/reviews/me`);
      return res.data;
    },
  });

  return (
    <div className="container-narrow py-10 space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your reviews</h1>
        <p className="text-sm text-muted-foreground">
          Reviews you've written. You can edit each one within 24 hours of submission.
        </p>
      </header>

      {isLoading && <Skeleton className="h-32" />}
      {isError && <FriendlyError kind="reviews" className="max-w-xl" />}
      {data && data.data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You haven't written any reviews yet.
          </CardContent>
        </Card>
      )}
      {data?.data.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base">
              <Link href={`/business/${r.business.slug}`} className="hover:underline">
                {r.business.displayName}
              </Link>
            </CardTitle>
            <CardDescription>{formatRelative(r.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <StarRating value={r.rating} />
            {r.title && <p className="font-semibold">{r.title}</p>}
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{r.content}</p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href={`/account/reviews/${r.id}`}>Edit</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}