import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium section heading — small gradient eyebrow + display title +
 * subtitle, with an optional right-aligned action. Used as the header
 * for repeating page sections.
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
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        isCenter && 'sm:flex-col sm:items-center sm:gap-3 sm:text-center',
        className,
      )}
    >
      <div className={cn('min-w-0 flex-1', isCenter && 'mx-auto max-w-2xl')}>
        {eyebrow && (
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <Tag className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </Tag>
        {subtitle && (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {!isCenter && action && <div className="shrink-0">{action}</div>}
    </div>
  );
}