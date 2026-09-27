import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusPillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        success: 'bg-success-subtle text-success-subtle-foreground',
        warning: 'bg-warning-subtle text-warning-subtle-foreground',
        danger: 'bg-destructive-subtle text-destructive-subtle-foreground',
        info: 'bg-info-subtle text-info-subtle-foreground',
        neutral: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

export type StatusTone = NonNullable<VariantProps<typeof statusPillVariants>['tone']>;

export interface StatusPillProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof statusPillVariants> {
  withDot?: boolean;
}

export function StatusPill({
  tone,
  withDot = false,
  className,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...props}>
      {withDot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { statusPillVariants };
