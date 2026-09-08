'use client';

import { usePublicStats } from '@/features/stats/use-public-stats';

/**
 * A short transparency strip on the Guidelines page. We surface two
 * numbers — review volume and active reviewer count — because they
 * describe the size of the community doing the moderation work, even
 * though they are not moderation-specific KPIs. We avoid displaying
 * fabricated moderation metrics.
 */
export function GuidelinesTransparencySection() {
  const { data, isLoading, isError } = usePublicStats();

  return (
    <div className="rounded-lg border bg-muted/30 p-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Community at a glance
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        These numbers update from our public stats endpoint.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Stat
          label="Reviews submitted"
          value={isLoading || isError || !data ? null : data.reviews}
        />
        <Stat
          label="Active reviewers"
          value={isLoading || isError || !data ? null : data.reviewers}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-2xl font-bold tracking-tight tabular-nums">
        {value === null ? '—' : value.toLocaleString('en-US')}+
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
