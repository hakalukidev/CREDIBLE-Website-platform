'use client';

/**
 * Small icon-tile used in stat cards, quick actions, and empty states.
 * Renders a soft-gradient bubble that floats and scales on hover so the
 * dashboard cards feel alive without being noisy.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IconTileProps {
  icon: ReactNode;
  /** Visual tone. `primary` is the trust-blue, `secondary` is the gold
   *  "certified" tone, `muted` is a neutral bubble for tertiary actions. */
  tone?: 'primary' | 'secondary' | 'muted' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<IconTileProps['tone']>, string> = {
  primary:
    'bg-gradient-to-br from-primary/15 via-primary/5 to-transparent text-primary ring-1 ring-primary/15',
  secondary:
    'bg-gradient-to-br from-secondary/20 via-secondary/5 to-transparent text-secondary-foreground ring-1 ring-secondary/20',
  muted:
    'bg-gradient-to-br from-muted via-muted/40 to-transparent text-foreground ring-1 ring-border/70',
  success:
    'bg-gradient-to-br from-success/15 via-success/5 to-transparent text-success ring-1 ring-success/20',
};

const SIZE_CLASSES: Record<NonNullable<IconTileProps['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

export function IconTile({
  icon,
  tone = 'primary',
  size = 'md',
  className,
}: IconTileProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden
    >
      {icon}
    </span>
  );
}
