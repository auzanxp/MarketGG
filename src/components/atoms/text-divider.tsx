import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextDividerProps extends React.ComponentProps<'div'> {
  children: React.ReactNode;
}

export function TextDivider({ className, children, ...props }: TextDividerProps) {
  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  );
}
