import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AdminStatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

const TONE_CLASSES: Record<AdminStatusTone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-secondary/20 text-secondary-foreground',
  destructive: 'bg-destructive/15 text-destructive',
  info: 'bg-info/15 text-info',
  muted: 'bg-muted text-muted-foreground',
};

const BASE_CLASSES =
  'inline-flex rounded-full px-2 py-0.5 text-xs font-medium';

interface AdminStatusBadgeProps {
  tone: AdminStatusTone;
  children: ReactNode;
  className?: string;
}

/**
 * Shared status pill used across admin tables and queues. Replaces ad-hoc
 * inline `bg-success/15 text-success` ternaries per row, and keeps tone mapping
 * consistent across user / contact / review / billing / subscription lists.
 */
export function AdminStatusBadge({
  tone,
  children,
  className,
}: AdminStatusBadgeProps) {
  return (
    <span className={cn(BASE_CLASSES, TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}
