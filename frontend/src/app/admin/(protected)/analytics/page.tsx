'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { Download } from 'lucide-react';

interface AdminAnalytics {
  totalBusinesses: number;
  verifiedBusinesses: number;
  pendingVerifications: number;
  totalUsers: number;
  totalReviews: number;
  averageRating: number;
  flaggedReviews: number;
  subscriptionStats: Record<string, number>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  totalRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  verificationRate: number;
  widgetImpressions: number;
  reviewDistribution: Record<string, number>;
}

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
];

const PLAN_COLORS: Record<string, string> = {
  FREE: '#9ca3af',
  BASIC: 'hsl(239 84% 54%)',
  PROFESSIONAL: 'hsl(157 68% 44%)',
  ENTERPRISE: 'hsl(262 83% 65%)',
};

const RATING_COLORS = [
  'hsl(0 72% 60%)',
  'hsl(24 90% 58%)',
  'hsl(38 92% 54%)',
  'hsl(82 76% 52%)',
  'hsl(157 68% 44%)',
];

function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

function useExportCsv() {
  return async (range: string) => {
    const fallback = `credible-admin-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    const response = await apiClient.get('/admin/analytics/export.csv', {
      params: { range },
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    const headers = response.headers as Record<string, string | undefined>;
    const disposition = headers['content-disposition'] ?? headers['Content-Disposition'];
    const filename = filenameFromDisposition(disposition, fallback);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: qk.analytics.admin(range),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminAnalytics }>(
        `/admin/analytics?range=${range}`,
      );
      return res.data.data;
    },
  });

  const exportCsv = useExportCsv();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform analytics</h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide metrics across users, businesses, and revenue.
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void exportCsv(range);
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export
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
            <Kpi title="Total revenue" value={`BDT ${data.totalRevenue.toLocaleString()}`} delta={data.revenueGrowth} />
            <Kpi title="Total users" value={data.totalUsers.toLocaleString()} delta={data.userGrowth} />
            <Kpi title="Total reviews" value={data.totalReviews.toLocaleString()} subtitle={`${data.averageRating.toFixed(2)}★ avg`} />
            <Kpi
              title="Verification rate"
              value={`${data.verificationRate}%`}
              subtitle={`${data.verifiedBusinesses} verified`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue trend</CardTitle>
                <CardDescription>Monthly successful payments (BDT)</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={data.monthlyRevenue.map((m) => ({ date: m.month, count: m.amount }))}
                  color="hsl(239 84% 54%)"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subscription distribution</CardTitle>
                <CardDescription>Active plans across businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={Object.entries(data.subscriptionStats).map(([plan, value]) => ({
                    label: plan,
                    value,
                    color: PLAN_COLORS[plan] ?? '#9ca3af',
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Review distribution</CardTitle>
                <CardDescription>All-time rating breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[1, 2, 3, 4, 5].map((r) => ({
                    label: `${r}★`,
                    value: data.reviewDistribution[String(r)] ?? 0,
                    color: RATING_COLORS[r - 1],
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Platform stats</CardTitle>
                <CardDescription>Operational health</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <Row label="Total businesses" value={data.totalBusinesses} />
                  <Row label="Verified businesses" value={data.verifiedBusinesses} />
                  <Row label="Pending verifications" value={data.pendingVerifications} highlight />
                  <Row label="Flagged reviews" value={data.flaggedReviews} highlight />
                  <Row label="Widget impressions" value={data.widgetImpressions.toLocaleString()} />
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  title,
  value,
  subtitle,
  delta,
}: {
  title: string;
  value: string;
  subtitle?: string;
  delta?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        {typeof delta === 'number' && delta !== 0 && (
          <div className={`mt-1 text-xs ${delta >= 0 ? 'text-success' : 'text-destructive'}`}>
            {delta >= 0 ? '+' : ''}
            {delta}% vs prior period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold text-secondary-foreground' : 'font-medium'}>{value}</span>
    </li>
  );
}