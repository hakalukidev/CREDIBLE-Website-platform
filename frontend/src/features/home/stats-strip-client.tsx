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
      {STATS.map(({ key, label, icon: Icon, suffix }, idx) => (
        <div
          key={key}
          className="group flex items-center gap-4 transition-transform duration-300 hover:-translate-y-0.5"
          style={{ transitionDelay: `${idx * 20}ms` }}
        >
          <span
            aria-hidden
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:shadow-glow"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
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