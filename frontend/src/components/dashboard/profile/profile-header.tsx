'use client';

/**
 * Premium featured header for the Profile page. Mirrors the Overview
 * Hero pattern (featured SectionCard + decorative radial glows) but is
 * profile-specific:
 *   - Larger avatar (h-28/w-28)
 *   - Full name + email as the title block
 *   - Role badge + status badge + member-since line
 *   - Right-side Edit Profile button
 *
 * Animation is subtle: the avatar fades + scales in, no bounce.
 */

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionFadeUp } from '@/components/ui/motion-primitives';
import { IconTile } from '../primitives/icon-tile';
import { SectionCard } from '../primitives/section-card';
import { duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  roleLabel: string;
  statusLabel?: string | null;
  memberSinceLabel?: string | null;
  avatarUrl?: string | null;
  avatarFallback: string;
  onEditProfile: () => void;
  className?: string;
}

const AVATAR_TRANSITION = { duration: duration.base, ease: easeOut } as const;

export function ProfileHeader({
  fullName,
  email,
  roleLabel,
  statusLabel,
  memberSinceLabel,
  avatarUrl,
  avatarFallback,
  onEditProfile,
  className,
}: ProfileHeaderProps) {
  return (
    <MotionFadeUp className={className}>
      <SectionCard
        featured
        interactive
        className="relative overflow-hidden p-6 sm:p-8"
      >
        {/* Decorative radial glows — cosmetic, sit below interactive content. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-1/3 h-44 w-44 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-2xl"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={AVATAR_TRANSITION}
              className="relative shrink-0"
            >
              <Avatar className="h-24 w-24 ring-2 ring-background shadow-card sm:h-28 sm:w-28">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={fullName} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent text-2xl font-semibold text-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <IconTile
                  icon={<Sparkles className="h-4 w-4" />}
                  tone="primary"
                  size="sm"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Your account
                </p>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {fullName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> {roleLabel}
                </Badge>
                {statusLabel && (
                  <Badge variant="outline" className="gap-1">
                    {statusLabel}
                  </Badge>
                )}
                {memberSinceLabel && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    {memberSinceLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onEditProfile}
            className={cn('shrink-0 gap-2 self-start shadow-pop sm:self-auto')}
          >
            Edit profile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </SectionCard>
    </MotionFadeUp>
  );
}
