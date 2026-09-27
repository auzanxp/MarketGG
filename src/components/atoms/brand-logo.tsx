import * as React from 'react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { mark: 'size-7 rounded-[9px]', glyph: 'size-3.5', text: 'text-sm' },
  md: { mark: 'size-8 rounded-[10px]', glyph: 'size-4', text: 'text-base' },
  lg: { mark: 'size-10 rounded-xl', glyph: 'size-5', text: 'text-lg' },
} as const;

export type BrandLogoSize = keyof typeof SIZES;

export interface BrandLogoProps extends React.ComponentProps<'span'> {
  size?: BrandLogoSize;
  showWordmark?: boolean;
}

function BrandMarkGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('text-primary-foreground', className)}
    >
      <path
        d="M5 6.5 12 18 19 6.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  className,
  ...props
}: BrandLogoProps) {
  const scale = SIZES[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)} {...props}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center bg-primary shadow-sm shadow-primary/25',
          scale.mark
        )}
      >
        <BrandMarkGlyph className={scale.glyph} />
      </span>
      {showWordmark ? (
        <span className={cn('font-heading font-semibold tracking-tight', scale.text)}>
          VocaMarket
        </span>
      ) : (
        <span className="sr-only">VocaMarket</span>
      )}
    </span>
  );
}
