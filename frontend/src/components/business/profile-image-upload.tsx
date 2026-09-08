'use client';

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

export interface ProfileImageUploadProps {
  /** Existing image URL (after upload this gets replaced). */
  value?: string | null;
  /** Storage namespace — `avatars` for user avatars, `public` for business/professional logos. */
  namespace: 'avatars' | 'public';
  /** Called with the resulting { key, publicUrl } after a successful upload. */
  onChange: (result: { key: string; publicUrl: string } | null) => void;
  /** Render as a square avatar or wide cover image. */
  variant?: 'avatar' | 'cover';
  disabled?: boolean;
  className?: string;
}

interface PresignResponse {
  url: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  maxBytes: number;
  headers: Record<string, string>;
}

/**
 * Drag-and-drop image uploader for the business/professional profile pages.
 *
 * Flow:
 *   1. Validate file type + size client-side (mirror server-side checks).
 *   2. POST /uploads/presign → get a one-time PUT URL + the canonical
 *      public URL we'll store.
 *   3. PUT the file body to the presigned URL with the returned headers.
 *   4. Fire `onChange({ key, publicUrl })` so the parent form can persist
 *      the key in its PATCH request.
 */
export function ProfileImageUpload({
  value,
  namespace,
  onChange,
  variant = 'avatar',
  disabled = false,
  className,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error('Use a JPG, PNG, or WebP image.');
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error('Image is too large. Max 5 MB.');
        return;
      }
      setUploading(true);
      // Show an optimistic local preview while we upload.
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      try {
        // 1. Ask the server for a presigned PUT URL.
        const presignRes = await apiClient.post<{ success: true; data: PresignResponse }>(
          '/uploads/presign',
          {
            namespace,
            contentType: file.type,
            originalName: file.name,
            size: file.size,
          },
        );
        const { url, key, publicUrl, headers } = presignRes.data.data;

        // 2. PUT the file body to S3/R2 with the exact headers the signature expects.
        const putRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers,
        });
        if (!putRes.ok) {
          throw new Error(`Upload failed (${putRes.status})`);
        }

        URL.revokeObjectURL(localUrl);
        setPreview(publicUrl);
        onChange({ key, publicUrl });
        toast.success('Image uploaded.');
      } catch (err) {
        URL.revokeObjectURL(localUrl);
        setPreview(value ?? null);
        toast.error(friendlyMessage(err, 'upload'));
      } finally {
        setUploading(false);
      }
    },
    [namespace, onChange, value],
  );

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    // Reset so the same file can be re-selected later.
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  function handleClear() {
    setPreview(null);
    onChange(null);
  }

  const isAvatar = variant === 'avatar';

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click();
        }}
        className={cn(
          'group relative flex items-center justify-center overflow-hidden border-2 border-dashed bg-muted/30 transition-colors',
          isAvatar ? 'h-28 w-28 rounded-full' : 'h-40 w-full rounded-xl',
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Profile"
            className={cn(
              'h-full w-full object-cover',
              isAvatar ? 'rounded-full' : 'rounded-xl',
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center px-4">
            {isAvatar ? (
              <Camera className="h-6 w-6" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <p className="text-xs">
                  Drag an image or <span className="text-primary font-medium">browse</span>
                </p>
              </>
            )}
            {isAvatar && (
              <span className="text-[11px] font-medium">
                {uploading ? 'Uploading…' : 'Upload photo'}
              </span>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {preview && !uploading && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={Array.from(ALLOWED_TYPES).join(',')}
          className="hidden"
          onChange={handleFile}
          disabled={disabled}
        />
      </div>
      {!isAvatar && (
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, or WebP, up to 5 MB. Recommended 1600 × 600 px.
        </p>
      )}
    </div>
  );
}
