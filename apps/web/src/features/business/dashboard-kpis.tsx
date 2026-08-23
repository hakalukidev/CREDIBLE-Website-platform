'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, Users, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, extractError } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function DashboardKpis() {
  const { data, isLoading, isError, error } = useQuery({
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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          {extractError(error).message}
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      icon: Star,
      label: 'Average rating',
      value: data ? Number(data.ratingAverage ?? 0).toFixed(1) : '—',
    },
    { icon: MessageSquare, label: 'Total reviews', value: data?.ratingCount ?? 0 },
    { icon: Users, label: 'Profile views', value: '—' },
    {
      icon: ShieldCheck,
      label: 'Verification',
      value: data?.verificationStatus ?? 'NOT_STARTED',
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