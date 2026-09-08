'use client';

/**
 * PageHeader — premium title block used at the top of every dashboard
 * sub-page. Optional eyebrow, gradient underline accent, and CTA slot
 * for actions like "New", "Filter", etc.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.header
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: duration.base, ease: easeOut }}
      className={cn(
        'flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}
