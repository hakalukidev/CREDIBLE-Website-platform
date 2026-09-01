'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { StarRating } from '@/components/reviews/star-rating';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface BusinessCardProps {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  logo?: string | null;
  rating?: number | null;
  reviewCount?: number;
  isVerified?: boolean;
  badgeType?: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  location?: {
    city?: string | null;
    state?: string | null;
    country?: string | null;
  };
  category?: string | null;
  establishedYear?: number | null;
  onClick?: () => void;
  className?: string;
  showFeatures?: {
    showDescription?: boolean;
    showLocation?: boolean;
    showCategory?: boolean;
    showEstablishedYear?: boolean;
  };
}

function formatLocation(loc?: BusinessCardProps['location']): string | null {
  if (!loc) return null;
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function VerificationOverlay({
  level,
}: {
  level: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
}) {
  if (level === 'NONE') return null;

  const label =
    level === 'CERTIFIED'
      ? 'Certified'
      : level === 'PREMIUM'
        ? 'Verified Premium'
        : 'Verified';

  const colorClass =
    level === 'CERTIFIED'
      ? 'bg-secondary/90 text-secondary-foreground'
      : level === 'PREMIUM'
        ? 'bg-success/90 text-success-foreground'
        : 'bg-primary/90 text-primary-foreground';

  return (
    <span
      className={cn(
        'absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm',
        colorClass,
      )}
    >
      <VerifiedBadge level={level} size="sm" withLabel={false} />
      {label}
    </span>
  );
}

export function BusinessCard({
  id,
  slug,
  name,
  description,
  coverImage,
  logo,
  rating,
  reviewCount = 0,
  badgeType = 'NONE',
  location,
  category,
  establishedYear,
  onClick,
  className,
  showFeatures = {},
}: BusinessCardProps) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const {
    showDescription = true,
    showLocation = true,
    showCategory = true,
    showEstablishedYear = true,
  } = showFeatures;

  const displayLocation = formatLocation(location);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  const ratingNum = typeof rating === 'string' ? parseFloat(rating) : (rating ?? 0);

  const cardContent = (
    <Link
      href={`/business/${slug}`}
      onClick={onClick}
      aria-label={`View profile of ${name}`}
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        onClick ? 'cursor-pointer' : '',
        className,
      )}
    >
      {/* Image container — 140px fixed height */}
      <div className="relative h-[140px] w-full shrink-0 overflow-hidden bg-muted">
        {coverImage && !imgError ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            priority={false}
          />
        ) : logo && !logoError ? (
          <Image
            src={logo}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setLogoError(true)}
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 transition-transform duration-300 group-hover:scale-105">
            <span className="text-4xl font-bold text-primary/60">{initial}</span>
          </div>
        )}

        {/* Verification badge overlay */}
        <VerificationOverlay level={badgeType} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Rating row — fixed height */}
        <div className="h-4">
          {ratingNum > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={ratingNum} className="h-3.5 w-3.5" />
              <span className="text-sm font-semibold">{ratingNum.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Business name — truncate to 1 line */}
        <h3 className="truncate text-base font-semibold leading-tight">{name}</h3>

        {/* Description — always reserve 2 lines for consistency */}
        <div className="min-h-[2.5rem]">
          {showDescription && description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : showDescription ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              &nbsp;
            </p>
          ) : null}
        </div>

        {/* Location */}
        <div className="h-4">
          {showLocation && displayLocation && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{displayLocation}</span>
            </p>
          )}
        </div>

        {/* Category pill + established year */}
        <div className="mt-auto min-h-[1.5rem]">
          {(showCategory || showEstablishedYear) && (category || establishedYear) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {showCategory && category && (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {category}
                </Badge>
              )}
              {showEstablishedYear && establishedYear && (
                <span className="text-[10px] text-muted-foreground">Est. {establishedYear}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA — visual cue only; the entire card is the link */}
      <div className="px-4 pb-4">
        <span
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'pointer-events-none w-full',
          )}
        >
          View Profile
        </span>
      </div>
    </Link>
  );

  return cardContent;
}

/* -------------------------------------------------------------------------- */
/*  Skeleton loading state                                                    */
/* -------------------------------------------------------------------------- */

export function BusinessCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm',
        className,
      )}
    >
      <Skeleton className="h-[140px] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-[2.5rem] w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
