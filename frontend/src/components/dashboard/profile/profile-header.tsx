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

import { useRef, useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionFadeUp } from '@/components/ui/motion-primitives';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { ALLOWED_TYPES, MAX_BYTES } from '@/components/business/profile-image-upload';
import { IconTile } from '../primitives/icon-tile';
import { SectionCard } from '../primitives/section-card';
import { duration, easeOut } from '@/lib/animations';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { refreshSessionUser } from '@/lib/auth/refresh-session-user';
import { uploadToStorage } from '@/lib/upload';
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
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarPending, setAvatarPending] = useState(false);

  const saveAvatar = useMutation({
    mutationFn: async (avatar: string) => {
      const res = await apiClient.patch<{ success: true; data: { avatar: string } }>(
        '/users/me',
        { avatar },
      );
      return res.data.data;
    },
    onSuccess: (updated) => {
      refreshSessionUser({ avatar: updated.avatar });
      qc.invalidateQueries({ queryKey: qk.users.me() });
      toast.success('Profile photo updated');
    },
    onError: (err) => toast.error(friendlyMessage(err, 'upload')),
  });

  const busy = avatarPending || saveAvatar.isPending;

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected later.
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image is too large. Max 5 MB.');
      return;
    }
    setAvatarPending(true);
    try {
      const { publicUrl } = await uploadToStorage(file, 'avatars');
      saveAvatar.mutate(publicUrl);
    } catch (err) {
      toast.error(friendlyMessage(err, 'upload'));
    } finally {
      setAvatarPending(false);
    }
  }

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

              {/* "+" overlay — opens the file picker to swap the photo */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                aria-label="Update profile photo"
                title="Update profile photo"
                className="absolute -bottom-1 -right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-pop ring-2 ring-card transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 disabled:hover:scale-100"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={Array.from(ALLOWED_TYPES).join(',')}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </motion.div>

            <div className="min-w-0">
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
        </div>
      </SectionCard>
    </MotionFadeUp>
  );
}
