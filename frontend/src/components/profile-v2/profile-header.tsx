'use client';

/**
 * ProfileHeader — top section of the public profile (cover, avatar,
 * identity row). Persistence callbacks come from `profile-page-content`.
 */

import { useRef, useState } from 'react';
import {
  Pencil,
  Image as ImageIcon,
  Camera,
  Trash2,
  Plus,
  MapPin,
  Globe,
  ExternalLink,
  UserRound,
} from 'lucide-react';
import { initials as buildInitials, prettyUrl } from '@credible/shared';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { uploadToStorage } from '@/lib/upload';

import type { ProfileV2 } from '@/lib/hooks/use-profile-v2';

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #111827 0%, #374151 100%)',
];

const COVER_COLORS = ['#1A56DB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#111827'];

export interface ProfileHeaderProps {
  profile: ProfileV2;
  isOwner: boolean;
  /** Called when the owner clicks the "Switch to professional" button.
   *  Only ever fired when the owner does NOT already own a professional
   *  page. The button itself is also only rendered in that state, so
   *  the orchestrator can treat the call as a hard signal to open the
   *  `SwitchToProfessionalDialog`. */
  onSwitchToProfessional?: () => void;
  onSaveAvatar: (url: string) => Promise<void> | void;
  onRemoveAvatar: () => Promise<void> | void;
  onSaveCover: (input: { imageUrl?: string | null; color?: string | null }) => Promise<void> | void;
}

export function ProfileHeader({
  profile,
  isOwner,
  onSwitchToProfessional,
  onSaveAvatar,
  onRemoveAvatar,
  onSaveCover,
}: ProfileHeaderProps) {
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('avatar');
    try {
      const res = await uploadToStorage(file, 'avatars');
      await onSaveAvatar(res.publicUrl);
    } catch {
      toast.error('Photo upload failed.');
    } finally {
      setUploading(null);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('cover');
    try {
      const res = await uploadToStorage(file, 'public');
      await onSaveCover({ imageUrl: res.publicUrl });
    } catch {
      toast.error('Cover upload failed.');
    } finally {
      setUploading(null);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  }

  const fullName = profile.fullName || profile.username || 'Member';
  const roleLabel = profile.role === 'ADMIN' ? 'Administrator' : null;

  return (
    <header className="space-y-4">
      {/* Cover */}
      <div
        className="relative h-40 w-full overflow-hidden rounded-2xl sm:h-52"
        style={{
          background: profile.coverImage
            ? `url(${profile.coverImage}) center / cover no-repeat`
            : profile.coverColor ?? COVER_GRADIENTS[0],
        }}
        aria-hidden
      >
        {isOwner && (
          <div className="absolute right-3 top-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Change cover"
                  title="Change cover"
                  className="h-8 w-8 bg-background/85 backdrop-blur"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Upload image
                  </p>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5"
                    disabled={uploading === 'cover'}
                    onClick={() => coverFileRef.current?.click()}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {uploading === 'cover' ? 'Uploading…' : 'Choose image'}
                  </Button>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Gradient
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COVER_GRADIENTS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-label="Pick gradient"
                        className="h-7 w-7 rounded-full border border-border"
                        style={{ background: g }}
                        onClick={() => {
                          void onSaveCover({ imageUrl: null, color: g });
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Solid color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COVER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label="Pick color"
                        className="h-7 w-7 rounded-full border border-border"
                        style={{ background: c }}
                        onClick={() => {
                          void onSaveCover({ imageUrl: null, color: c });
                        }}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    void onSaveCover({ imageUrl: null, color: null });
                  }}
                >
                  Remove cover
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Identity row */}
      <div className="-mt-12 flex flex-col items-start gap-4 px-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6 sm:px-6">
        <div className="relative shrink-0">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md sm:h-32 sm:w-32">
            {profile.avatar ? (
              <AvatarImage src={profile.avatar} alt={fullName} />
            ) : null}
            <AvatarFallback className="bg-muted text-2xl font-medium">
              {buildInitials(profile.firstName, profile.lastName) || '?'}
            </AvatarFallback>
          </Avatar>
          {isOwner && (
            <>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Edit profile photo"
                    disabled={uploading === 'avatar'}
                    className="absolute bottom-0 right-0 bg-background hover:bg-background/90 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    disabled={uploading === 'avatar'}
                    onSelect={() => avatarFileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {uploading === 'avatar' ? 'Uploading…' : 'Change Profile Photo'}
                  </DropdownMenuItem>
                  {profile.avatar && (
                    <DropdownMenuItem
                      destructive
                      disabled={uploading === 'avatar'}
                      onSelect={() => {
                        void onRemoveAvatar();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Profile Photo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">
              {fullName}
            </h1>
            {roleLabel && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {roleLabel}
              </span>
            )}
            {profile.isHireable && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Available for hire
              </span>
            )}
          </div>
          {profile.headline && (
            <p className="text-sm text-muted-foreground sm:text-base">
              {profile.headline}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground sm:text-sm">
            {profile.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {prettyUrl(profile.website)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {isOwner &&
          (profile.professional ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              aria-label="Professional account"
            >
              <UserRound className="h-3.5 w-3.5" />
              Professional
            </span>
          ) : (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onSwitchToProfessional?.();
              }}
            >
              <UserRound className="h-3.5 w-3.5" />
              Switch to professional
            </Button>
          ))}
      </div>
    </header>
  );
}
