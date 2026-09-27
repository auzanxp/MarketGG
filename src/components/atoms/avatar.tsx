'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { box: 'size-8 text-[0.65rem]', px: 32 },
  md: { box: 'size-9 text-xs', px: 36 },
  lg: { box: 'size-11 text-sm', px: 44 },
} as const;

export interface AvatarProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  src?: string;
  name: string;
  initials: string;
  size?: keyof typeof SIZES;
}

export function Avatar({ src, name, initials, size = 'md', className, ...props }: AvatarProps) {
  const [hasImageFailed, setHasImageFailed] = React.useState(false);
  const scale = SIZES[size];
  const showImage = Boolean(src) && !hasImageFailed;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-subtle font-semibold text-primary select-none',
        scale.box,
        className
      )}
      {...props}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name}
          width={scale.px}
          height={scale.px}
          onError={() => setHasImageFailed(true)}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
