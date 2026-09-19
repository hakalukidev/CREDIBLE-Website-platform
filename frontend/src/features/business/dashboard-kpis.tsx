'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, Users, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';

interface BusinessAnalyticsSummary {
  summary: {
    totalVisits: number;
    totalReviews: number;
    averageRating: number;
    widgetImpressions: number;
    responseRate: number;
  };
}

export function DashboardKpis() {
  const profile = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      const res = await apiClient.get('/businesses/me/profile');
      return res.data.data as {
        ratingAverage: string | null;
        ratingCount: number;
        verificationStatus: string;
      };
    },
  });

  const analytics = useQuery({
    queryKey: qk.analytics.business('30d'),
    queryFn: async () => {
      const res = await apiClient.get('/businesses/me/analytics', {
        params: { range: '30d' },
      });
      return res.data.data as BusinessAnalyticsSummary;
    },
    retry: false,
  });

  if (profile.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (profile.isError) {
    return <FriendlyError kind="kpis" />;
  }

  const profileViews = analytics.data?.summary.totalVisits ?? 0;

  const cards = [
    {
      icon: Star,
      label: 'Average rating',
      value: profile.data ? Number(profile.data.ratingAverage ?? 0).toFixed(1) : '—',
    },
    { icon: MessageSquare, label: 'Total reviews', value: profile.data?.ratingCount ?? 0 },
    {
      icon: Users,
      label: 'Profile views',
      value: analytics.isLoading
        ? '…'
        : profileViews.toLocaleString(),
    },
    {
      icon: ShieldCheck,
      label: 'Verification',
      value: profile.data?.verificationStatus ?? 'NOT_STARTED',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map(({ icon: Icon, label, value }) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{String(value)}</p>
              </div>
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}