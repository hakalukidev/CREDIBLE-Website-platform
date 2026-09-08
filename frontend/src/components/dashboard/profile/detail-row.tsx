'use client';

/**
 * Reusable definition-list row used across the Profile page.
 *
 * Renders an icon tile, label, value, optional inline action
 * (e.g. "Change →"), and optional supporting copy. Visually
 * consistent with the dashboard primitives: soft icon bubble on
 * the left, two-column content on the right, hover-tinted row.
 */

import type { ReactNode } from 'react';
import { IconTile } from '../primitives/icon-tile';
import { cn } from '@/lib/utils';

export type DetailRowTone = 'primary' | 'secondary' | 'muted' | 'success';

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  tone?: DetailRowTone;
  value: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function DetailRow({
  icon,
  label,
  tone = 'primary',
  value,
  action,
  description,
  className,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/40 sm:gap-4 sm:px-4',
        className,
      )}
    >
      <IconTile icon={icon} tone={tone} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {value}
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
