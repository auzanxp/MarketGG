import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CenteredPanelTemplateProps extends React.ComponentProps<'div'> {
  maxWidth?: 'sm' | 'md';
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
} as const;

export function CenteredPanelTemplate({
  maxWidth = 'sm',
  className,
  children,
  ...props
}: CenteredPanelTemplateProps) {
  return (
    <div
      className={cn('flex min-h-[60vh] w-full items-center justify-center py-6', className)}
      {...props}
    >
      <div className={cn('w-full text-center', MAX_WIDTH_CLASSES[maxWidth])}>{children}</div>
    </div>
  );
}
