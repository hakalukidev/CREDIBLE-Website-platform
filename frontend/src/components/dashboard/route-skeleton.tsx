'use client';

// Shared loading skeleton for client-only dashboard routes. Wraps
// `next/dynamic` so the same Suspense-friendly fallback can be reused
// across all four lazy pages.

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export type RouteVariant = 'register' | 'list' | 'reviews' | 'profile';

interface SkeletonForProps {
  variant: RouteVariant;
}

function SkeletonFor({ variant }: SkeletonForProps) {
  if (variant === 'reviews') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }
  if (variant === 'profile') {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-2xl md:col-span-2" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }
  if (variant === 'register') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function makeDynamicRoute(loader: Parameters<typeof dynamic>[0], variant: RouteVariant) {
  // Cast through `unknown` so the loader's inferred default component
  // type (often `ComponentType<never>` when the module re-exports a
  // hook-using component without explicit props) matches `dynamic`'s
  // expectation.
  return dynamic(loader, {
    ssr: false,
    loading: () => <SkeletonFor variant={variant} />,
  } as Parameters<typeof dynamic>[1]);
}
