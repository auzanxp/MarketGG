import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconTileVariants = cva('inline-flex shrink-0 items-center justify-center', {
  variants: {
    tone: {
      primary: 'bg-primary-subtle text-primary',
      info: 'bg-info-subtle text-info',
      success: 'bg-success-subtle text-success',
      warning: 'bg-warning-subtle text-warning-subtle-foreground',
      destructive: 'bg-destructive-subtle text-destructive',
      neutral: 'bg-muted text-muted-foreground',
    },
    size: {
      sm: 'size-8 rounded-lg [&_svg]:size-4',
      md: 'size-10 rounded-xl [&_svg]:size-5',
      lg: 'size-12 rounded-2xl [&_svg]:size-6',
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
});

export type IconTileTone = NonNullable<VariantProps<typeof iconTileVariants>['tone']>;

export interface IconTileProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof iconTileVariants> {}

export function IconTile({ tone, size, className, children, ...props }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(iconTileVariants({ tone, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { iconTileVariants };
