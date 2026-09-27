import * as React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps extends Omit<React.ComponentProps<'p'>, 'children'> {
  label: string;
  direction: 'up' | 'down' | 'flat';
  isFavourable?: boolean;
  comparison?: string;
}

const DIRECTION_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

export function TrendIndicator({
  label,
  direction,
  isFavourable = true,
  comparison,
  className,
  ...props
}: TrendIndicatorProps) {
  const Icon = DIRECTION_ICONS[direction];

  return (
    <p className={cn('flex items-center gap-1 text-xs', className)} {...props}>
      <Icon
        aria-hidden="true"
        className={cn(
          'size-3.5 shrink-0',
          direction === 'flat'
            ? 'text-muted-foreground'
            : isFavourable
              ? 'text-success'
              : 'text-destructive'
        )}
      />
      <span
        className={cn(
          'font-semibold',
          direction === 'flat'
            ? 'text-muted-foreground'
            : isFavourable
              ? 'text-success'
              : 'text-destructive'
        )}
      >
        {label}
      </span>
      {comparison && <span className="text-muted-foreground">{comparison}</span>}
    </p>
  );
}
