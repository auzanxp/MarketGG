import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  size?: 'sm' | 'md' | 'lg';
  /** Pass null inside a button whose text already announces loading. */
  label?: string | null;
}

const SIZES = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
} as const;

export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  const isDecorative = label === null;

  return (
    <span
      {...(isDecorative ? { 'aria-hidden': true } : { role: 'status' })}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin', SIZES[size])} aria-hidden="true" />
      {!isDecorative && <span className="sr-only">{label}</span>}
    </span>
  );
}
