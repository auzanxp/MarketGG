import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TwoColumnTemplateProps extends React.ComponentProps<'div'> {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  ratio?: 'equal' | 'wide-primary';
  stickySecondary?: boolean;
}

const RATIO_CLASSES = {
  equal: 'lg:grid-cols-2',
  'wide-primary': 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]',
} as const;

export function TwoColumnTemplate({
  primary,
  secondary,
  ratio = 'equal',
  stickySecondary = false,
  className,
  ...props
}: TwoColumnTemplateProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-6 lg:gap-8', RATIO_CLASSES[ratio], className)}
      {...props}
    >
      <div className="min-w-0">{primary}</div>
      <div className="min-w-0">
        <div className={cn(stickySecondary && 'lg:sticky lg:top-22')}>{secondary}</div>
      </div>
    </div>
  );
}
