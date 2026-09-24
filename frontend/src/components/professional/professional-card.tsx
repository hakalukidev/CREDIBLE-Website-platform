'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import {
  formatLocation,
  VerificationOverlay,
  ViewProfileStrip,
  type VerificationLevel,
} from '@/components/ui/profile-card-shared';
import { cn } from '@/lib/utils';

export interface ProfessionalCardProps {
  slug: string;
  name: string;
  /** Profession label, e.g. "Doctor". Shown as the primary sub-line. */
  profession: string;
  /** Optional headline / tagline. Shown as the secondary description. */
  headline?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  city?: string | null;
  country?: string | null;
  rating?: number | null;
  reviewCount?: number;
  badgeType?: VerificationLevel;
  onClick?: () => void;
  className?: string;
}

/**
 * Visual sibling to BusinessCard so the Browse grid can mix businesses
 * and professionals in one layout. Header uses coverImage when present,
 * falling back to the avatar; if both are missing, renders a gradient
 * with the professional's initial so cards never appear empty.
 */
export function ProfessionalCard({
  slug,
  name,
  profession,
  headline,
  avatar,
  coverImage,
  city,
  country,
  rating,
  reviewCount = 0,
  badgeType = 'NONE',
  onClick,
  className,
}: ProfessionalCardProps) {
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const safeCoverImage =
    typeof coverImage === 'string' && coverImage.trim().length > 0 ? coverImage : undefined;
  const safeAvatar =
    typeof avatar === 'string' && avatar.trim().length > 0 ? avatar : undefined;

  const displayLocation = formatLocation([city, country]);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  const ratingNum = typeof rating === 'string' ? parseFloat(rating) : (rating ?? 0);

  return (
    <Link
      href={`/p/${slug}`}
      onClick={onClick}
      aria-label={`View profile of ${name}`}
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 text-card-foreground shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className,
      )}
    >
      <div className="relative h-[144px] w-full shrink-0 overflow-hidden bg-muted">
        {safeCoverImage && !imgError ? (
          <SafeImage
            src={safeCoverImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            priority={false}
          />
        ) : safeAvatar && !avatarError ? (
          <SafeImage
            src={safeAvatar}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setAvatarError(true)}
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/15 via-primary/10 to-secondary/10 transition-transform duration-500 group-hover:scale-105">
            <span className="font-display text-4xl font-bold text-primary/50">{initial}</span>
          </div>
        )}
        <VerificationOverlay level={badgeType} />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* Rating row — fixed height to align cards in the grid */}
        <div className="h-4">
          {ratingNum > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{ratingNum.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>

        <h3 className="truncate font-display text-base font-semibold leading-tight">{name}</h3>

        {/* Profession is the primary sub-line for professionals (analogous to
            tagline for businesses). Headline is the secondary description. */}
        <p className="truncate text-xs font-medium text-primary">{profession}</p>

        <div className="min-h-[2.5rem]">
          {headline ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{headline}</p>
          ) : (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">&nbsp;</p>
          )}
        </div>

        {/* Location */}
        <div className="h-4">
          {displayLocation && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{displayLocation}</span>
            </p>
          )}
        </div>

        {/* Type pill so mixed grids are unambiguous. */}
        <div className="mt-auto min-h-[1.5rem]">
          <Badge variant="outline" className="text-[10px] font-medium">
            Professional
          </Badge>
        </div>
      </div>

      <ViewProfileStrip />
    </Link>
  );
}

export function ProfessionalCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card',
        className,
      )}
    >
      <Skeleton className="h-[144px] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-[2.5rem] w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto flex gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}
