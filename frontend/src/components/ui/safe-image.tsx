'use client';

import Image, { type ImageProps } from 'next/image';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { isAllowedImageHost } from '@/lib/image-hosts';

type SafeImageProps = Omit<ImageProps, 'src' | 'alt' | 'onError'> & {
  src: string | null | undefined;
  alt: string;
  fallback?: React.ReactNode;
  /** Fallback element class for an <img> when next/image refuses to render. */
  imgClassName?: string;
  onError?: () => void;
};

/**
 * SafeImage — a drop-in replacement for `next/image` that never crashes on
 * unconfigured hosts.
 *
 * Why this exists: Next.js throws at render time when an `<Image src>` points
 * at a hostname not listed in `images.remotePatterns` (e.g. a fresh R2 public
 * bucket subdomain). That's hostile to user-facing pages — the whole tree
 * unmounts. This component:
 *
 *   1. Detects the hostname at runtime.
 *   2. Renders `<Image>` when the host is allowed (so optimization kicks in).
 *   3. Falls back to a plain `<img>` otherwise — same shape, same `fill`
 *      semantics, no crash.
 *   4. Catches image load errors and swaps to a `fallback` node (or nothing).
 *
 * The result: a new S3/R2/Cloudinary bucket means zero config changes — the
 * page always renders, just unoptimized images until config is updated.
 */
export function SafeImage({
  src,
  alt,
  fallback,
  imgClassName,
  className,
  onError,
  ...rest
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  const parsed = useMemo(() => {
    if (!src || typeof src !== 'string') return null;
    try {
      // Absolute URLs parse cleanly. Relative ones get a base.
      const url = new URL(src, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
      return {
        url,
        isAbsolute: src.startsWith('http://') || src.startsWith('https://'),
        protocol: url.protocol.replace(':', ''),
      };
    } catch {
      return null;
    }
  }, [src]);

  if (!src || !parsed) {
    return fallback ?? null;
  }

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  if (errored) {
    return fallback ?? null;
  }

  const useNextImage =
    (!parsed.isAbsolute || (parsed.protocol === 'https' && isAllowedImageHost(parsed.url.hostname))) &&
    (parsed.protocol === 'http' || parsed.protocol === 'https');

  if (useNextImage) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        {...rest}
      />
    );
  }

  // Fallback: plain <img> with the same visual semantics.
  // We can't perfectly replicate `fill` mode without a wrapping element, so
  // callers using `fill` should pass `style={{ width: '100%', height: '100%' }}`
  // — or wrap the result in a positioned container. For 99% of uses this is fine.
  const style: React.CSSProperties =
    (rest as { fill?: boolean }).fill
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
      : {};

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(className, imgClassName)}
      onError={handleError}
      loading={rest.priority ? 'eager' : 'lazy'}
      decoding="async"
      style={style}
    />
  );
}
