'use client';

import { Building2 } from 'lucide-react';
import { BusinessCard, BusinessCardSkeleton } from '@/components/business/business-card';
import { FriendlyError } from '@/components/ui/friendly-error';
import { useFeaturedBusinesses } from './use-featured-businesses';

interface Props {
  /** Number of businesses to fetch / display (default 4). */
  limit?: number;
  /** Empty-state title (shown when the directory is empty). */
  emptyTitle?: string;
  /** Empty-state body (shown when the directory is empty). */
  emptyBody?: string;
}

export function FeaturedBusinesses({
  limit = 4,
  emptyTitle = 'No businesses yet',
  emptyBody = 'Verified businesses will appear here once owners join and are verified.',
}: Props) {
  const { items, isLoading, isError } = useFeaturedBusinesses(limit);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <FriendlyError kind="businesses" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center">
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((b) => (
        <BusinessCard
          key={b.id}
          id={b.id}
          slug={b.slug}
          name={b.displayName}
          tagline={b.tagline}
          description={b.description}
          coverImage={b.coverImage}
          logo={b.logo}
          rating={
            b.ratingAverage != null && b.ratingAverage !== ''
              ? Number(b.ratingAverage)
              : null
          }
          reviewCount={b.ratingCount}
          badgeType={b.verificationLevel}
          location={
            b.city || b.state || b.country
              ? { city: b.city, state: b.state, country: b.country }
              : undefined
          }
          category={b.category}
          establishedYear={b.yearEstablished}
        />
      ))}
    </div>
  );
}