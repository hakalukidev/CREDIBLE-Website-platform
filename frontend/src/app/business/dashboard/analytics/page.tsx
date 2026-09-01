'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Download } from 'lucide-react';

interface BusinessAnalytics {
  reviews: {
    total: number;
    average: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
    dailyTrend: Array<{ date: string; count: number }>;
    flaggedCount: number;
  };
  visits: {
    total: number;
    uniqueIps: number;
    dailyVisits: Array<{ date: string; count: number }>;
    topReferrers: Array<{ referrer: string; count: number }>;
  };
  widgets: {
    impressions: number;
    byType: Array<{ widgetType: string; count: number }>;
    dailyImpressions: Array<{ date: string; count: number }>;
  };
  summary: {
    totalReviews: number;
    averageRating: number;
    totalVisits: number;
    widgetImpressions: number;
    responseRate: number;
  };
}

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
];

export default function BusinessAnalyticsPage() {
  const [range, setRange] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: qk.analytics.business(range),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: BusinessAnalytics }>(
        `/businesses/me/analytics?range=${range}`,
      );
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Insights about your reviews, profile visits, and widget performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" asChild>
            <a href={`/businesses/me/analytics/export.csv?range=${range}`} download>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </a>
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi title="Reviews" value={data.summary.totalReviews.toString()} />
            <Kpi title="Avg. rating" value={data.summary.averageRating.toFixed(2)} />
            <Kpi title="Profile visits" value={data.summary.totalVisits.toLocaleString()} />
            <Kpi title="Widget impressions" value={data.summary.widgetImpressions.toLocaleString()} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reviews trend</CardTitle>
                <CardDescription>New reviews per day</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart data={data.reviews.dailyTrend} color="#10b981" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Rating distribution</CardTitle>
                <CardDescription>Star ratings across new reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={data.reviews.ratingDistribution.map((r) => ({
                    label: `${r.rating}★`,
                    value: r.count,
                    color:
                      r.rating >= 4 ? '#10b981' : r.rating === 3 ? '#f59e0b' : '#ef4444',
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profile visits</CardTitle>
                <CardDescription>
                  {data.visits.total} visits • {data.visits.uniqueIps} unique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart data={data.visits.dailyVisits} color="#1a56db" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top referrers</CardTitle>
                <CardDescription>Sources driving visits</CardDescription>
              </CardHeader>
              <CardContent>
                {data.visits.topReferrers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No referrers yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.visits.topReferrers.map((r) => (
                      <li key={r.referrer} className="flex items-center justify-between gap-3">
                        <span className="truncate text-muted-foreground" title={r.referrer}>
                          {r.referrer}
                        </span>
                        <span className="font-medium">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Widget performance</CardTitle>
                <CardDescription>
                  {data.summary.widgetImpressions} total impressions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={data.widgets.byType.map((w) => ({
                    label: w.widgetType,
                    value: w.count,
                    color: '#1a56db',
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}