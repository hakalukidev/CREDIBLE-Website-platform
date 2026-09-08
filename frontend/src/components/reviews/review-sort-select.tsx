'use client';

import * as React from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ReviewSortKey = 'helpful' | 'newest' | 'highest' | 'lowest';

interface ReviewSortSelectProps {
  value: ReviewSortKey;
  onChange: (value: ReviewSortKey) => void;
  className?: string;
}

const OPTIONS: Array<{ value: ReviewSortKey; label: string; hint: string }> = [
  { value: 'helpful', label: 'Most helpful', hint: 'Highest helpful votes first' },
  { value: 'newest', label: 'Newest first', hint: 'Most recent reviews on top' },
  { value: 'highest', label: 'Highest rated', hint: '5-star reviews first' },
  { value: 'lowest', label: 'Lowest rated', hint: '1-star reviews first' },
];

/**
 * Chrome-style sort dropdown — a button with a label and chevron that
 * opens a popover with the four sort options.
 *
 * Why not a native `<select>`: native selects can't render the
 * contextual hint copy under each option, and they don't animate the
 * menu open/close. The button + DropdownMenu pattern matches Chrome's
 * own "sort by" UI on reviews surfaces.
 */
export function ReviewSortSelect({ value, onChange, className }: ReviewSortSelectProps) {
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-card px-4 text-sm font-medium text-foreground shadow-card transition-colors hover:bg-muted/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'data-[state=open]:bg-muted/40',
          className,
        )}
        aria-label={`Sort reviews. Currently sorted by ${current.label}.`}
      >
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">Sort by:</span>
        <span>{current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Sort reviews
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onChange(opt.value)}
            className="flex items-start gap-2 py-2"
          >
            <span
              className={cn(
                'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                value === opt.value ? 'text-primary' : 'text-transparent',
              )}
              aria-hidden
            >
              <Check className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
