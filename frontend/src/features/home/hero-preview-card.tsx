'use client';

import { Building2, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { useFeaturedBusinesses } from './use-featured-businesses';

interface HeroPreviewCardProps {
  /**
   * Number of top businesses to fetch. The card only displays the first
   * one. Pass the same value used by the sibling FeaturedBusinesses so
   * the shared in-flight request cache de-duplicates the network call.
   */
  limit?: number;
}

function formatLocation(item: { city: string | null; state?: string | null; country?: string | null }): string | null {
  const parts = [item.city, item.state, item.country].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function yearsSince(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  if (diff <= 0) return 0;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365)));
}

export function HeroPreviewCard({ limit = 4 }: HeroPreviewCardProps = {}) {
  const { items, isLoading } = useFeaturedBusinesses(limit);
  const top = items[0] ?? null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-24 w-full" />
        <CardContent className="pt-0 -mt-10">
          <Skeleton className="h-20 w-20 rounded-lg" />
          <Skeleton className="mt-3 h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!top) return null;

  const location = formatLocation(top);
  const rating =
    top.ratingAverage != null && top.ratingAverage !== ''
      ? Number(top.ratingAverage)
      : null;
  const verifiedYears = yearsSince(top.badgeIssuedAt);

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary to-success" />
      <CardContent className="pt-0 -mt-10">
        <div className="flex items-end gap-4">
          <div className="h-20 w-20 rounded-lg border-4 border-card bg-muted flex items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{top.displayName}</h3>
              {top.verificationLevel !== 'NONE' && (
                <VerifiedBadge level={top.verificationLevel} size="sm" />
              )}
            </div>
            {location && <p className="text-sm text-muted-foreground">{location}</p>}
          </div>
        </div>

        {rating != null && (
          <div className="mt-4 flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1 text-sm font-medium"
              aria-label={`Rating ${rating.toFixed(1)} out of 5`}
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">{top.ratingCount} reviews</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
          {verifiedYears != null && verifiedYears > 0 && (
            <div className="rounded-md border bg-card p-2">
              <p className="font-bold text-lg">{verifiedYears}</p>
              <p className="text-muted-foreground">
                {verifiedYears === 1 ? 'yr' : 'yrs'} verified
              </p>
            </div>
          )}
          {rating != null && (
            <div className="rounded-md border bg-card p-2">
              <p className="font-bold text-lg">{Math.round((rating / 5) * 100)}%</p>
              <p className="text-muted-foreground">Trust score</p>
            </div>
          )}
          <div className="rounded-md border bg-card p-2">
            <p className="font-bold text-lg">{top.ratingCount}</p>
            <p className="text-muted-foreground">Reviews</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}