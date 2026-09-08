'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search as SearchIcon,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminApplications,
  useAdminStats,
  type AdminApplication,
} from '@/features/admin/admin-verification-hooks';
import type { VerificationStatusKey } from '@/features/verification/verification-hooks';

const STATUS_FILTERS: Array<{ label: string; value: VerificationStatusKey | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'In review', value: 'HUMAN_REVIEW_REQUIRED' },
  { label: 'Auto-checking', value: 'AUTO_CHECKING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const STATUS_BADGE: Record<VerificationStatusKey, 'secondary' | 'success' | 'destructive' | 'default'> = {
  NOT_STARTED: 'secondary',
  PENDING: 'secondary',
  DOCUMENTS_UPLOADED: 'secondary',
  AUTO_CHECKING: 'default',
  HUMAN_REVIEW_REQUIRED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

export default function AdminVerificationQueuePage() {
  const [filter, setFilter] = useState<VerificationStatusKey | 'ALL'>('HUMAN_REVIEW_REQUIRED');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const stats = useAdminStats();
  const list = useAdminApplications({
    status: filter === 'ALL' ? undefined : filter,
    search: search || undefined,
    page,
    perPage: 20,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Verification queue</h1>
        <p className="text-sm text-muted-foreground">
          Review applications, approve badges, and revoke misbehaving businesses.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Total applications"
          value={stats.data?.totalApplications ?? 0}
          icon={Clock}
          loading={stats.isLoading}
        />
        <StatCard
          label="Pending review"
          value={stats.data?.pendingReview ?? 0}
          icon={AlertTriangle}
          loading={stats.isLoading}
        />
        <StatCard
          label="Approved today"
          value={stats.data?.approvedToday ?? 0}
          icon={CheckCircle2}
          loading={stats.isLoading}
        />
        <StatCard
          label="Avg. review hours"
          value={stats.data?.averageReviewHours ?? 0}
          icon={Clock}
          loading={stats.isLoading}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Use the filters below to narrow down by status or search by business name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                type="button"
                variant={filter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-64"
              />
            </div>
          </div>

          {list.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          )}

          {list.data && list.data.items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No applications match the current filters.
            </p>
          )}

          {list.data && list.data.items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Business</th>
                  <th className="px-2 py-2">Level</th>
                  <th className="px-2 py-2">Documents</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Applied</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((a) => (
                  <Row key={a.id} app={a} />
                ))}
              </tbody>
            </table>
          )}

          {list.data && list.data.total > 20 && (
            <div className="flex items-center justify-between text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} · {list.data.total} total
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page * 20 >= list.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ app }: { app: AdminApplication }) {
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-3">
        <Link href={`/admin/verification/${app.id}`} className="font-medium hover:underline">
          {app.business.displayName}
        </Link>
        <p className="text-xs text-muted-foreground">{app.business.slug}</p>
      </td>
      <td className="px-2 py-3 text-xs">{app.level}</td>
      <td className="px-2 py-3 text-xs">{app.documents.length}</td>
      <td className="px-2 py-3">
        <Badge variant={STATUS_BADGE[app.status]}>{app.status.replace(/_/g, ' ')}</Badge>
      </td>
      <td className="px-2 py-3 text-xs text-muted-foreground">
        {new Date(app.appliedAt).toLocaleDateString()}
      </td>
      <td className="px-2 py-3 text-right">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/admin/verification/${app.id}`}>Open</Link>
        </Button>
      </td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-20" />;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

// quiet the unused import warning in some bundlers
void XCircle;