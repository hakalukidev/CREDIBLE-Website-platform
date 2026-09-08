'use client';

import { Building2, MessageSquareQuote, UserCheck, Sparkles } from 'lucide-react';
import { usePublicStats } from '@/features/stats/use-public-stats';
import { AnimatedCounter } from '@/components/static/animated-counter';

const STATS = [
  { key: 'businesses', label: 'Verified businesses', icon: Building2, suffix: '+' },
  { key: 'reviews', label: 'Reviews submitted', icon: MessageSquareQuote, suffix: '+' },
  { key: 'reviewers', label: 'Active reviewers', icon: UserCheck, suffix: '+' },
  { key: 'years', label: 'Years of trust', icon: Sparkles, suffix: '' },
] as const;

export function StatsStripClient() {
  const { data, isLoading, isError } = usePublicStats();
  const ready = !isLoading && !isError && data;

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map(({ key, label, icon: Icon, suffix }) => (
        <div key={key} className="flex items-center gap-4">
          <span
            aria-hidden
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
              {ready ? (
                <AnimatedCounter value={data[key]} suffix={suffix} />
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
