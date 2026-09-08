'use client';

/**
 * EmptyState — premium zero-data surface for the dashboard. Used when
 * a user has no reviews, no businesses, etc. Soft icon bubble, copy,
 * optional primary/secondary CTAs.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { IconTile } from './icon-tile';
import { duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  tone?: 'primary' | 'secondary' | 'muted' | 'success';
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  tone = 'primary',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeOut }}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-12 text-center',
        className,
      )}
    >
      <IconTile icon={icon} tone={tone} size="lg" className="mb-5" />
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
