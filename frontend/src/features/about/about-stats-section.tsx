'use client';

import { Building2, MessageSquareQuote, UserCheck, Sparkles } from 'lucide-react';
import { usePublicStats } from '@/features/stats/use-public-stats';
import { AnimatedCounter } from '@/components/static/animated-counter';

const STATS = [
  {
    key: 'businesses',
    label: 'Verified businesses',
    icon: Building2,
    suffix: '+',
  },
  {
    key: 'reviews',
    label: 'Reviews submitted',
    icon: MessageSquareQuote,
    suffix: '+',
  },
  {
    key: 'reviewers',
    label: 'Active reviewers',
    icon: UserCheck,
    suffix: '+',
  },
  {
    key: 'years',
    label: 'Years of trust',
    icon: Sparkles,
    suffix: '',
  },
] as const;

export function AboutStatsSection() {
  const { data, isLoading, isError } = usePublicStats();

  return (
    <section className="relative mt-10 overflow-hidden rounded-3xl border border-border/60 bg-card/50 shadow-card backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      <div className="grid gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ key, label, icon: Icon, suffix }) => (
          <div key={key} className="flex flex-col items-center text-center">
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15"
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="mt-3 font-display text-4xl font-bold tracking-tight">
              {isLoading || isError || !data ? (
                <span className="text-muted-foreground/50">—</span>
              ) : (
                <AnimatedCounter value={data[key]} suffix={suffix} />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}