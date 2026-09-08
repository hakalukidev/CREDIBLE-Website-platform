'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';

interface Props {
  images: string[];
  alt: string;
  /** Pass `object-cover` style className to the inner slides. */
  className?: string;
}

/**
 * Touch-friendly image carousel using Embla (~3KB, no other deps).
 *
 * Renders nothing when `images` is empty so callers can mount it inline
 * without guarding. Up to 6 images — the backend enforces the same limit.
 */
export function GalleryCarousel({ images, alt, className }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncState = useCallback((api: NonNullable<typeof emblaApi>) => {
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return undefined;
    syncState(emblaApi);
    emblaApi.on('select', syncState).on('reInit', syncState);
    return () => {
      emblaApi.off('select', syncState).off('reInit', syncState);
    };
  }, [emblaApi, syncState]);

  if (images.length === 0) return null;

  // Single image: skip the carousel chrome and just render the photo.
  if (images.length === 1) {
    return (
      <div
        className={cn(
          'relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted',
          className,
        )}
      >
        <SafeImage
          src={images[0]}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[16/9] w-full shrink-0 grow-0 basis-full bg-muted"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
            >
              <SafeImage
                src={src}
                alt={`${alt} photo ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {canScrollPrev && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full opacity-90 shadow"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {canScrollNext && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full opacity-90 shadow"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next photo"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            className={cn(
              'h-2 rounded-full transition-all',
              i === selectedIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
            )}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}