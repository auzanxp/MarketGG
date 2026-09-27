import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  value?: number;
  max?: number;
}

export function Rating({ value, max = 5, className, ...props }: RatingProps) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const formatted = value.toFixed(1);

  return (
    <span
      role="img"
      aria-label={`Rated ${formatted} out of ${max}`}
      className={cn('inline-flex items-center gap-1 text-xs font-semibold text-warning', className)}
      {...props}
    >
      <Star className="size-3.5 fill-current" aria-hidden="true" />
      <span aria-hidden="true">{formatted}</span>
    </span>
  );
}
