'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SectionCard } from '../primitives/section-card';
import { duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface ProfileCompletionItem {
  id: string;
  label: string;
  complete: boolean;
}

interface ProfileCompletionCardProps {
  percent: number;
  items: ProfileCompletionItem[];
  className?: string;
}

const ITEM_TRANSITION = { duration: duration.fast, ease: easeOut } as const;

export function ProfileCompletionCard({
  percent,
  items,
  className,
}: ProfileCompletionCardProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <SectionCard className={cn('h-full p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Profile strength
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {safePercent}% complete
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A complete profile helps your reviews stand out and builds trust
            with businesses and clients.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Progress value={safePercent} aria-label="Profile completion" />
      </div>

      <ul className="mt-5 space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...ITEM_TRANSITION, delay: i * 0.04 }}
            className="flex items-center gap-2.5 text-sm"
          >
            {item.complete ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            )}
            <span
              className={
                item.complete
                  ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                  : 'text-foreground'
              }
            >
              {item.label}
            </span>
          </motion.li>
        ))}
      </ul>

      {safePercent < 100 && (
        <Button asChild size="sm" className="mt-5 w-full sm:w-auto">
          <Link href={'/dashboard/profile' as never}>Complete your profile</Link>
        </Button>
      )}
    </SectionCard>
  );
}
