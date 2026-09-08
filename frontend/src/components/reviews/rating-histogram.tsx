'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingHistogramProps {
  /**
   * Length-5 array. Index 0 = count of 5-star reviews, index 4 = count
   * of 1-star reviews. Bars sum to `total`.
   */
  distribution: number[];
  average: number;
  total: number;
  /**
   * Called when a bar is clicked. The parent can use this to apply a
   * filter to the review list. The currently active filter should be
   * passed back via `activeFilter` so the matching bar can render in
   * its "selected" state.
   */
  onFilter?: (stars: number) => void;
  /** Currently active star filter, or `null` for "all reviews". */
  activeFilter?: number | null;
  className?: string;
}

const STAR_LABELS = ['5 stars', '4 stars', '3 stars', '2 stars', '1 star'];
const STAR_VALUES = [5, 4, 3, 2, 1];

/**
 * Chrome / Google-style rating histogram.
 *
 * Left column: large numeric average + "out of 5" label + 5 filled stars.
 * Right column: 5 distribution bars with labels and counts.
 *
 * Each bar is an interactive `<button>` so keyboard users can activate
 * the filter via Enter / Space. The active filter is visually marked
 * with a thicker fill bar and a subtle ring.
 */
export function RatingHistogram({
  distribution,
  average,
  total,
  onFilter,
  activeFilter,
  className,
}: RatingHistogramProps) {
  const safeTotal = Math.max(0, total);
  const safeAverage = Number.isFinite(average) ? average : 0;
  const max = Math.max(1, ...distribution);

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr] sm:gap-10',
        className,
      )}
      aria-label="Rating distribution"
    >
      {/* Left column — big number + stars */}
      <div className="flex flex-row items-center gap-5 sm:flex-col sm:items-start sm:gap-2">
        <p className="text-5xl font-medium tabular-nums text-foreground sm:text-6xl">
          {safeAverage.toFixed(1)}
        </p>
        <div className="flex flex-col gap-1">
          <div
            className="inline-flex items-center gap-0.5"
            aria-label={`${safeAverage.toFixed(1)} out of 5 stars`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < Math.round(safeAverage)
                    ? 'fill-secondary text-secondary'
                    : 'fill-transparent text-muted-foreground/40',
                )}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            out of 5 · {safeTotal.toLocaleString()} review{safeTotal === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Right column — distribution bars */}
      <ul className="space-y-1.5">
        {STAR_VALUES.map((stars, i) => {
          const count = distribution[i] ?? 0;
          const pct = safeTotal > 0 ? (count / max) * 100 : 0;
          const isActive = activeFilter === stars;

          return (
            <li key={stars}>
              <button
                type="button"
                onClick={() => onFilter?.(stars)}
                disabled={!onFilter || count === 0}
                aria-pressed={isActive}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md px-2 py-1 text-left transition-colors',
                  'hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive && 'bg-muted',
                )}
              >
                <span className="w-12 shrink-0 text-xs font-medium text-foreground tabular-nums">
                  {STAR_LABELS[i]}
                </span>
                <span
                  className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full bg-secondary transition-[width] duration-300',
                      isActive && 'ring-2 ring-secondary/40 ring-offset-1',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {count.toLocaleString()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
