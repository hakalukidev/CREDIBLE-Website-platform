'use client';

/**
 * Profile-page wrapper around the shared `ProfileImageUpload` drag-drop
 * widget.
 *
 * Important: the backend has no `PATCH /users/me/avatar` endpoint today
 * — uploading returns a presigned URL but the resulting `publicUrl` is
 * never persisted to the user's record. To stay honest about what the
 * page can do, this component:
 *
 *   1. Renders the real upload widget so the user can pick/preview a
 *      photo locally (the widget is left enabled so the local preview
 *      continues to work).
 *   2. Surfaces a clear inline notice under the widget explaining that
 *      the preview is local-only until the backend ships the persist
 *      step.
 *
 * The notice copy is intentionally non-vague so users don't think their
 * photo was saved.
 */

import { useState } from 'react';
import { Info } from 'lucide-react';
import { ProfileImageUpload } from '@/components/business/profile-image-upload';
import { cn } from '@/lib/utils';

interface AvatarUploadZoneProps {
  currentAvatarUrl?: string | null;
  className?: string;
}

const DEFAULT_NOTICE =
  "Photo preview is local only — saving it to your account is queued for the next backend release.";

export function AvatarUploadZone({
  currentAvatarUrl,
  className,
}: AvatarUploadZoneProps) {
  // The widget calls onChange with the upload result. We hold the most
  // recent publicUrl locally so the preview stays stable across renders,
  // but we intentionally don't PATCH it back to /users/me — see the
  // notice below.
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const displayedAvatar = localAvatar || currentAvatarUrl || null;

  return (
    <div className={cn('flex flex-col items-start gap-5 sm:flex-row sm:items-center', className)}>
      <div className="shrink-0">
        <ProfileImageUpload
          value={displayedAvatar}
          namespace="avatars"
          variant="avatar"
          onChange={(result) => {
            // Local-only — we deliberately don't persist this. The notice
            // below tells the user why.
            setLocalAvatar(result?.publicUrl ?? null);
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Change your avatar
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag a JPG, PNG, or WebP image (max 5&nbsp;MB) onto the circle, or
          click to browse. Square photos work best.
        </p>

        <div
          role="note"
          className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] px-3 py-2.5 text-xs text-muted-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="leading-relaxed">{DEFAULT_NOTICE}</p>
        </div>
      </div>
    </div>
  );
}
