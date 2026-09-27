import * as React from 'react';
import { IconTile, type IconTileTone } from '../atoms/icon-tile';
import { cn } from '@/lib/utils';

export interface FeatureHighlightProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: IconTileTone;
  size?: 'sm' | 'md';
}

export function FeatureHighlight({
  icon,
  title,
  description,
  tone = 'primary',
  size = 'sm',
  className,
  ...props
}: FeatureHighlightProps) {
  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <IconTile tone={tone} size={size}>
        {icon}
      </IconTile>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{title}</p>
        {description && (
          <p className="truncate text-[0.6875rem] text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
