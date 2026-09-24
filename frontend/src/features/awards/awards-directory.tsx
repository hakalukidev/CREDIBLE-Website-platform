'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AwardWinner {
  id: string;
  category: string;
  name: string;
  year: number;
  description: string;
  emoji: string;
  hue: string;
}

interface AwardsDirectoryProps {
  winners: AwardWinner[];
}

const CATEGORIES = ['All', 'Banking', 'Technology', 'Restaurants', 'Healthcare', 'Legal'] as const;
const YEARS = [2026, 2025] as const;

function AwardMedal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id="dirMedal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(43 96% 60%)" />
          <stop offset="100%" stopColor="hsl(35 92% 44%)" />
        </linearGradient>
      </defs>
      <path d="M22 40l-6 18 12-6 4 6 4-6 12 6-6-18" fill="hsl(35 92% 44%)" />
      <circle cx="32" cy="28" r="18" fill="url(#dirMedal)" stroke="hsl(35 80% 24%)" strokeWidth="1.5" />
      <path d="M32 18l2.6 5.5 6 .9-4.4 4.3 1 6-5.2-2.8-5.2 2.8 1-6L23.4 24.4l6-.9z" fill="white" />
    </svg>
  );
}

/**
 * Filterable awards directory — used by /awards. Category filter chips +
 * dropdown selects for category/year. Inspired by awwwards.com/directory.
 */
export function AwardsDirectory({ winners }: AwardsDirectoryProps) {
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>('All');
  const [year, setYear] = React.useState<number | 'All'>('All');

  const filtered = winners.filter((w) => {
    if (category !== 'All' && w.category !== category) return false;
    if (year !== 'All' && w.year !== year) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Directory
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            This year’s winners.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-xs text-muted-foreground">Filter:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="h-9 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground shadow-card transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) =>
              setYear(e.target.value === 'All' ? 'All' : Number(e.target.value))
            }
            className="h-9 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground shadow-card transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none"
            aria-label="Filter by year"
          >
            <option value="All">All years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={cn(
                'inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition-all',
                active
                  ? 'bg-foreground text-background shadow-sm'
                  : 'border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {c}
            </button>
          );
        })}
        <span className="ml-2 inline-flex h-8 items-center rounded-full bg-muted px-3 text-xs text-muted-foreground">
          {filtered.length} winner{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w, i) => (
          <li
            key={w.id}
            className="group relative overflow-hidden rounded-2xl border border-gold-200/70 bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-ring-gold"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${w.hue} blur-2xl opacity-70 transition-opacity group-hover:opacity-100`}
            />

            <div className="relative flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-100 to-gold-50 text-2xl ring-1 ring-gold-300/60">
                <span>{w.emoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">
                  {w.category}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{w.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{w.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700">
                    <Sparkles className="h-3 w-3" />
                    {w.year} Winner
                  </span>
                  <Link
                    href={'/browse' as never}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    View profile
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            <AwardMedal className="pointer-events-none absolute -bottom-3 -right-3 h-14 w-14 opacity-15 transition-opacity group-hover:opacity-30" />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No winners match those filters yet. Try another category.
          </p>
        </div>
      )}
    </div>
  );
}
