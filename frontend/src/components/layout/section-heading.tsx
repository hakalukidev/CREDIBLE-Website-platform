import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Chrome-style section heading — used as the header for repeating page
 * sections (How it works, Featured, Value props, etc.) where the brief
 * asks for a small label + title + subtitle + optional action.
 *
 * Composition rules:
 *  - Title is rendered as `<h2>` so the document hierarchy stays
 *    correct (one `<h1>` per page from PageShell, then `<h2>` for
 *    sections).
 *  - On `center` alignment the eyebrow + title + subtitle stack
 *    centered. On `left` (default) they stack left-aligned with the
 *    action pinned to the right edge on `sm+`.
 */
interface SectionHeadingProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  /** Optional right-aligned slot (e.g. "See all" link). */
  action?: React.ReactNode;
  /** Optional className for the outer wrapper. */
  className?: string;
  /** Heading level override. Default is h2. */
  as?: 'h2' | 'h3';
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
  className,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  const isCenter = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        isCenter && 'sm:flex-col sm:items-center sm:gap-2 sm:text-center',
        className,
      )}
    >
      <div className={cn('min-w-0 flex-1', isCenter && 'mx-auto max-w-2xl')}>
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <Tag className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </Tag>
        {subtitle && (
          <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {!isCenter && action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
