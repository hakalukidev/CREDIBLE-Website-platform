'use client';

/**
 * QuickActions — a 2×N grid of clickable action cards. Each action
 * renders an icon-tile + title + description and links to the
 * relevant dashboard route. Used on the Overview only.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { duration, easeOut } from '@/lib/animations';
import { IconTile } from '../primitives/icon-tile';
import { cn } from '@/lib/utils';

export interface QuickAction {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'muted' | 'success';
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {actions.map((action, i) => (
        <motion.div
          key={action.href}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration.base,
            ease: easeOut,
            delay: 0.04 * i,
          }}
        >
          <Link
            href={action.href as never}
            className="group flex h-full items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop"
          >
            <IconTile icon={action.icon} tone={action.tone ?? 'primary'} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {action.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
