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
    <section className="border-y bg-muted/30">
      <div className="container-wide py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ key, label, icon: Icon, suffix }) => (
            <div key={key} className="flex flex-col items-center text-center">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <div className="mt-3 text-4xl font-bold tracking-tight">
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
      </div>
    </section>
  );
}
