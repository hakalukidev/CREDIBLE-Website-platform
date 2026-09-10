'use client';

import { Building2, Star, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { useFeaturedBusinesses } from './use-featured-businesses';
import { motion } from 'framer-motion';

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
      <Card className="overflow-hidden shadow-pop">
        <Skeleton className="h-24 w-full" />
        <CardContent className="pt-0 -mt-10">
          <Skeleton className="h-20 w-20 rounded-2xl" />
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative"
    >
      {/* Glow behind card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent blur-2xl"
      />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <Card className="relative overflow-hidden border-border/80 shadow-pop">
          <div className="h-24 bg-gradient-to-r from-purple-500 via-primary to-pink-400" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
          <CardContent className="pt-0 -mt-10 relative">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-sm">
                <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden />
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{top.displayName}</h3>
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
                <div className="rounded-xl border border-border/70 bg-card/70 p-2">
                  <p className="font-display font-bold text-lg">{verifiedYears}</p>
                  <p className="text-muted-foreground">
                    {verifiedYears === 1 ? 'yr' : 'yrs'} verified
                  </p>
                </div>
              )}
              {rating != null && (
                <div className="rounded-xl border border-border/70 bg-card/70 p-2">
                  <p className="font-display font-bold text-lg">{Math.round((rating / 5) * 100)}%</p>
                  <p className="text-muted-foreground">Trust score</p>
                </div>
              )}
              <div className="rounded-xl border border-border/70 bg-card/70 p-2">
                <p className="font-display font-bold text-lg">{top.ratingCount}</p>
                <p className="text-muted-foreground">Reviews</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Badge verified by a real human reviewer
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Floating chip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute -left-4 top-10 hidden animate-float sm:block"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-pop backdrop-blur-md">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="text-xs font-semibold">Human-verified</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="absolute -right-3 bottom-16 hidden animate-float [animation-delay:-3s] lg:block"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-pop backdrop-blur-md">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
          </span>
          <span className="text-xs font-semibold">4.9 / 5 rating</span>
        </div>
      </motion.div>
    </motion.div>
  );
}