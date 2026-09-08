'use client';

/**
 * SectionCard — the universal container for any premium card surface in
 * the user dashboard. Wraps the existing `Card` primitive with our
 * dashboard conventions (subtle inner gradient + hover lift) so every
 * section feels consistent.
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Use for the larger hero cards (Overview greeting, Profile hero). */
  featured?: boolean;
  /** Disable the hover lift when the card is purely informational. */
  interactive?: boolean;
}

export function SectionCard({
  children,
  className,
  featured = false,
  interactive = false,
  ...rest
}: SectionCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-card',
        'transition-all duration-200 ease-out',
        interactive && 'hover:-translate-y-0.5 hover:shadow-pop',
        featured && 'border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface SectionCardHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionCardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionCardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-6 pt-6 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
