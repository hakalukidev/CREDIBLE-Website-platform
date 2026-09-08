'use client';

/**
 * StatCard — premium metric tile for the dashboard Overview. Soft inner
 * gradient, icon-tile, label, large value, and an optional helper row
 * (e.g. "+2 this week" or "of 5 sections"). Hover lifts the card.
 */

import { motion } from 'framer-motion';
import { duration, easeOut } from '@/lib/animations';
import { SectionCard } from '../primitives/section-card';
import { IconTile } from '../primitives/icon-tile';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'muted' | 'success';
  delay?: number;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary',
  delay = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeOut, delay }}
      className={className}
    >
      <SectionCard interactive className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {helper && (
              <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>
            )}
          </div>
          <IconTile icon={icon} tone={tone} size="md" />
        </div>
      </SectionCard>
    </motion.div>
  );
}

interface StatCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatCardGrid({ children, className }: StatCardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
