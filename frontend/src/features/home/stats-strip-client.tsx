'use client';

import * as React from 'react';
import { Building2, MessageSquareQuote, UserCheck, Eye, EyeOff } from 'lucide-react';
import { usePublicStats } from '@/features/stats/use-public-stats';
import { AnimatedCounter } from '@/components/static/animated-counter';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'credible.stats.visible';

const STATS = [
  { key: 'businesses', label: 'Verified businesses', icon: Building2, suffix: '+' },
  { key: 'reviews', label: 'Reviews submitted', icon: MessageSquareQuote, suffix: '+' },
  { key: 'reviewers', label: 'Active reviewers', icon: UserCheck, suffix: '+' },
] as const;

export function StatsStripClient() {
  const { data, isLoading, isError } = usePublicStats();
  const ready = !isLoading && !isError && data;

  // Toggle state — persisted to localStorage so the choice survives reloads.
  const [visible, setVisible] = React.useState<boolean>(true);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setVisible(stored === '1');
      }
    } catch {
      /* ignore — storage blocked */
    }
    setHydrated(true);
  }, []);

  const toggle = React.useCallback(() => {
    setVisible((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="relative">
      <div
        className={cn(
          'grid gap-8 pt-3 transition-all duration-500 sm:grid-cols-2 lg:grid-cols-3',
          hydrated && !visible && 'pointer-events-none max-h-0 -translate-y-2 overflow-hidden opacity-0',
          hydrated && visible && 'max-h-[600px] translate-y-0 opacity-100',
        )}
        aria-hidden={hydrated && !visible}
      >
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
    </div>
  );
}
