'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loader for the dashboard Overview page. Mirrors the structure of the
 * real content so the loading state doesn't cause layout shifts:
 *   - hero card
 *   - 4 stat tiles
 *   - profile-completion card
 *   - recent-reviews + quick-actions row (3-column on lg+)
 *
 * SSR is disabled because the Overview consumes `useSession` from a
 * persisted Zustand store (localStorage) — the server doesn't have it.
 */

const DashboardOverviewContent = dynamic(
  () => import('./page-content').then((m) => m.DashboardOverviewContent),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    ),
  },
);

export function DashboardOverviewContentLoader() {
  return <DashboardOverviewContent />;
}
