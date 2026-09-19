'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { PageShell } from '@/components/layout/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelative } from '@credible/shared';

type Status = 'ok' | 'degraded' | 'down';

interface ServiceRow {
  name: string;
  status: Status;
  message: string;
}

function interpret(payload: unknown): { status: Status; message: string } {
  if (payload && typeof payload === 'object' && (payload as { success?: unknown }).success === true) {
    return { status: 'ok', message: 'API responding' };
  }
  return { status: 'degraded', message: 'Unexpected response' };
}

export default function SystemStatusPage() {
  const api = useQuery({
    queryKey: ['system-status', 'public-health'],
    queryFn: async () => {
      const res = await apiClient.get('/public/health');
      return res.data;
    },
    refetchInterval: 60_000,
    retry: 1,
  });

  const apiCheck = api.isPending
    ? null
    : api.isError
      ? { status: 'down' as const, message: 'No response from API' }
      : interpret(api.data);

  const services: ServiceRow[] = [
    {
      name: 'API',
      status: apiCheck?.status ?? 'degraded',
      message: apiCheck?.message ?? 'Awaiting first check…',
    },
    {
      name: 'Website',
      status: apiCheck?.status === 'ok' ? 'ok' : 'degraded',
      message:
        apiCheck?.status === 'ok'
          ? 'You are viewing it now'
          : 'API unreachable — website may also be impacted',
    },
  ];

  const overall: Status =
    services.some((s) => s.status === 'down')
      ? 'down'
      : services.some((s) => s.status === 'degraded')
        ? 'degraded'
        : services.every((s) => s.status === 'ok')
          ? 'ok'
          : 'degraded';

  return (
    <div className="py-12">
      <PageShell
        eyebrow="System status"
        title="How Credible is doing."
        subtitle="Live liveness data from our public health endpoint. We re-check every minute."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {api.isPending && !apiCheck
            ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            : services.map((s) => <ServiceCard key={s.name} row={s} />)}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {api.dataUpdatedAt
              ? `Last checked ${formatRelative(new Date(api.dataUpdatedAt).toISOString())}`
              : 'Awaiting first health check…'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              void api.refetch();
            }}
          >
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Overall: {labelFor(overall)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              We probe our public <code>/public/health</code> endpoint on every page load and every
              minute after that. The cards above reflect the most recent result.
            </p>
            <p>
              We don&apos;t currently publish per-service uptime (verification queue, payment
              gateways, email delivery). Reach out via the contact page if you&apos;d like detailed
              incident reporting.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    </div>
  );
}

function labelFor(status: Status): string {
  switch (status) {
    case 'ok':
      return 'Operational';
    case 'degraded':
      return 'Degraded performance';
    case 'down':
      return 'Major outage';
  }
}

function ServiceCard({ row }: { row: ServiceRow }) {
  const styles = {
    ok: {
      ring: 'border-success/30',
      dot: 'bg-success',
      text: 'text-success',
      label: 'Operational',
      Icon: CheckCircle2,
    },
    degraded: {
      ring: 'border-amber-500/30',
      dot: 'bg-amber-500',
      text: 'text-amber-600',
      label: 'Degraded',
      Icon: AlertCircle,
    },
    down: {
      ring: 'border-destructive/30',
      dot: 'bg-destructive',
      text: 'text-destructive',
      label: 'Down',
      Icon: AlertCircle,
    },
  }[row.status];
  const Icon = styles.Icon;

  return (
    <Card className={`flex items-start justify-between gap-3 p-5 ${styles.ring}`}>
      <div className="min-w-0">
        <span className="font-display font-semibold">{row.name}</span>
        <p className="mt-1 text-xs text-muted-foreground">{row.message}</p>
      </div>
      <span className={`flex shrink-0 items-center gap-2 text-sm font-medium ${styles.text}`}>
        {row.status === 'degraded' && !row.message.includes('Awaiting') ? (
          <Loader2 className="hidden" aria-hidden />
        ) : (
          <Icon className="h-4 w-4" aria-hidden />
        )}
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden />
        {styles.label}
      </span>
    </Card>
  );
}
