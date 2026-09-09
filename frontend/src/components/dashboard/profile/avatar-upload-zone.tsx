'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileImageUpload } from '@/components/business/profile-image-upload';
import { apiClient } from '@/lib/api/client';
import { refreshSessionUser } from '@/lib/auth/refresh-session-user';
import { cn } from '@/lib/utils';

interface AvatarUploadZoneProps {
  currentAvatarUrl?: string | null;
  className?: string;
}

export function AvatarUploadZone({
  currentAvatarUrl,
  className,
}: AvatarUploadZoneProps) {
  const qc = useQueryClient();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const displayedAvatar = localAvatar || currentAvatarUrl || null;

  const saveAvatar = useMutation({
    mutationFn: async (avatar: string) => {
      const res = await apiClient.patch<{ success: true; data: { avatar: string } }>(
        '/users/me',
        { avatar },
      );
      return res.data.data;
    },
    onSuccess: (updated) => {
      setLocalAvatar(null);
      refreshSessionUser({ avatar: updated.avatar });
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  function handleUpload(result: { key: string; publicUrl: string } | null) {
    setLocalAvatar(result?.publicUrl ?? null);
    if (result?.publicUrl) {
      saveAvatar.mutate(result.publicUrl);
    }
  }

  return (
    <div className={cn('flex flex-col items-start gap-5 sm:flex-row sm:items-center', className)}>
      <div className="relative shrink-0">
        <ProfileImageUpload
          value={displayedAvatar}
          namespace="avatars"
          variant="avatar"
          onChange={handleUpload}
        />
        {saveAvatar.isPending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Change your avatar
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag a JPG, PNG, or WebP image (max 5&nbsp;MB) onto the circle, or
          click to browse. Square photos work best.
        </p>
      </div>
    </div>
  );
}
