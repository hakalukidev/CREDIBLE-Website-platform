'use client';

/**
 * SkeletonStack — quick way to lay out N skeleton blocks for any loading
 * state. Uses the existing `Skeleton` primitive.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonStackProps {
  count?: number;
  height?: string;
  gap?: 'tight' | 'normal' | 'loose';
  className?: string;
}

const GAP_CLASSES = {
  tight: 'space-y-2',
  normal: 'space-y-3',
  loose: 'space-y-4',
} as const;

export function SkeletonStack({
  count = 3,
  height = 'h-24',
  gap = 'normal',
  className,
}: SkeletonStackProps) {
  return (
    <div className={cn(GAP_CLASSES[gap], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('w-full', height)} />
      ))}
    </div>
  );
}
