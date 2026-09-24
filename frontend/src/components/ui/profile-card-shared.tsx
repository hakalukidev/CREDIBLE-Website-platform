'use client';

import { VerifiedBadge } from '@/components/verification/verified-badge';
import { cn } from '@/lib/utils';

export type VerificationLevel = 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';

/** Format a location from city/state/country fields. Empty parts are skipped. */
export function formatLocation(parts: Array<string | null | undefined>): string | null {
  const clean = parts.filter((p): p is string => Boolean(p && p.trim()));
  return clean.length > 0 ? clean.join(', ') : null;
}

/** Top-left verification pill (renders nothing when level === 'NONE'). */
export function VerificationOverlay({ level }: { level: VerificationLevel }) {
  if (level === 'NONE') return null;

  const label =
    level === 'CERTIFIED'
      ? 'Certified'
      : level === 'PREMIUM'
        ? 'Verified Premium'
        : 'Verified';

  const colorClass =
    level === 'CERTIFIED'
      ? 'bg-secondary/90 text-secondary-foreground'
      : level === 'PREMIUM'
        ? 'bg-success/90 text-success-foreground'
        : 'bg-primary/90 text-primary-foreground';

  return (
    <span
      className={cn(
        'absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm',
        colorClass,
      )}
    >
      <VerifiedBadge level={level} size="sm" withLabel={false} />
      {label}
    </span>
  );
}

/** Persistent "View Profile" strip — sits at the bottom of BusinessCard /
 *  ProfessionalCard so cards share the same CTA affordance in the grid. */
export function ViewProfileStrip() {
  return (
    <div className="px-5 pb-5">
      <span
        className={cn(
          'pointer-events-none flex h-9 w-full items-center justify-center rounded-full text-sm font-medium shadow-sm transition-all duration-300',
          'border border-border/80 bg-background/60 text-foreground group-hover:border-transparent group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/30 group-hover:shadow-md',
        )}
      >
        View Profile
      </span>
    </div>
  );
}
