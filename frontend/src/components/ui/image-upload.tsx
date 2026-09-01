'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiClient, extractError } from '@/lib/api/client';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  namespace: 'public' | 'avatars';
  label: string;
  aspect?: 'logo' | 'cover';
  disabled?: boolean;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

export function ImageUpload({
  value,
  onChange,
  namespace,
  label,
  aspect = 'logo',
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are supported.');
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`Image must be under ${MAX_MB} MB.`);
        return;
      }

      setUploading(true);
      try {
        // 1. Get presigned URL from our API. The server returns the exact
        //    headers we must echo back in the PUT so the signed policy
        //    matches (Content-Type + Content-Length when applicable).
        const presignRes = await apiClient.post<{
          success: true;
          data: {
            url: string;
            key: string;
            publicUrl: string;
            expiresIn: number;
            maxBytes: number;
            headers: Record<string, string>;
          };
        }>('/uploads/presign', {
          namespace,
          contentType: file.type,
          originalName: file.name,
          size: file.size,
        });
        const { url, publicUrl, headers } = presignRes.data.data;

        // 2. PUT the file directly to S3/R2. Send the same headers the
        //    signature was computed against; otherwise the request will be
        //    rejected with `SignatureDoesNotMatch`.
        const putRes = await fetch(url, {
          method: 'PUT',
          headers: { ...headers },
          body: file,
        });
        if (!putRes.ok) {
          throw new Error(`Upload to storage failed (${putRes.status})`);
        }

        // 3. Set the public URL in the form
        onChange(publicUrl);
        toast.success(`${label} uploaded`);
      } catch (err) {
        toast.error(extractError(err).message);
      } finally {
        setUploading(false);
      }
    },
    [namespace, label, onChange],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [handleFile],
  );

  const remove = useCallback(() => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange]);

  const isCover = aspect === 'cover';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <div
        className={`relative overflow-hidden rounded-lg border border-dashed bg-muted/30 transition-colors hover:bg-muted/50 ${
          isCover ? 'h-40 w-full' : 'h-36 w-36'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes={isCover ? '100vw' : '144px'}
            />
            {!disabled && !uploading && (
              <button
                type="button"
                onClick={remove}
                className="absolute right-1.5 top-1.5 z-10 rounded-full bg-background/80 p-1 text-muted-foreground backdrop-blur-sm transition-colors hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-xs font-medium">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-8 text-xs"
        >
          Replace
        </Button>
      )}
    </div>
  );
}
