'use client';

/**
 * ProfileSkeleton — placeholder used while the profile query is loading.
 *
 * Matches the height of the real header + tabs so the layout doesn't
 * reflow visibly when the data arrives.
 */

import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl sm:h-52" />
        <div className="-mt-12 flex items-end gap-4 px-4 sm:-mt-16 sm:px-6">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-background sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        {/* Sidebar skeleton: 4 stacked cards. */}
        <aside className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </aside>

        {/* Right column skeleton: tabs + content. */}
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
