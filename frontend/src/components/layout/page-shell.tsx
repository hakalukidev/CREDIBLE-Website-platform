import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Page shell — composes eyebrow + H1 + optional subtitle + children inside a
 * single `<section className="container-wide …">` so every page using it
 * aligns to the Homepage's section pattern (same gutter, same H1 rhythm).
 */
interface PageShellProps {
  children: React.ReactNode;
  /** Optional small caps text shown above the H1, e.g. "Bangladesh's trust layer". */
  eyebrow?: React.ReactNode;
  /** H1 content. Always rendered as `<h1>`. */
  title: React.ReactNode;
  /** Muted subtitle paragraph directly under the H1. */
  subtitle?: React.ReactNode;
  /** Container width for the children slot. */
  maxWidth?: 'reading' | 'wide' | 'full';
  /** Optional slot rendered to the right of the header (CTA, etc.). */
  headerAction?: React.ReactNode;
  /** Optional className applied to the outer section. */
  className?: string;
}

export function PageShell({
  children,
  eyebrow,
  title,
  subtitle,
  maxWidth = 'wide',
  headerAction,
  className,
}: PageShellProps) {
  const innerWidthClass =
    maxWidth === 'reading'
      ? 'max-w-3xl'
      : maxWidth === 'full'
        ? 'max-w-none'
        : 'max-w-6xl';

  return (
    <section className={cn('container-wide', className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-display">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-prose text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      <div className={cn('mt-8', innerWidthClass)}>{children}</div>
    </section>
  );
}
