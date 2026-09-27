'use client';

import * as React from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GalleryImage {
  src: string;
  /** Pass `''` when adjacent text already conveys the same thing. */
  alt: string;
}

export interface ImageGalleryProps {
  images: readonly GalleryImage[];
  overlay?: React.ReactNode;
  className?: string;
}

export function ImageGallery({ images, overlay, className }: ImageGalleryProps) {
  const [requestedIndex, setRequestedIndex] = React.useState(0);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex aspect-square w-full items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground',
          className
        )}
      >
        <ImageOff className="size-8" aria-hidden="true" />
        <span className="sr-only">No image available</span>
      </div>
    );
  }

  const activeIndex = Math.min(requestedIndex, images.length - 1);
  const active = images[activeIndex];
  const showStrip = images.length > 1;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          key={active.src}
          src={active.src}
          alt={active.alt}
          aria-hidden={active.alt.length === 0 ? 'true' : undefined}
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover"
          unoptimized
        />
        {overlay && <div className="absolute top-3 left-3 flex flex-wrap gap-2">{overlay}</div>}
      </div>

      {showStrip && (
        <ul className="grid grid-cols-4 gap-3">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={`${image.src}-${index}`}>
                <button
                  type="button"
                  onClick={() => setRequestedIndex(index)}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-muted transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    isActive ? 'border-primary' : 'border-transparent hover:border-border'
                  )}
                >
                  <Image
                    src={image.src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
