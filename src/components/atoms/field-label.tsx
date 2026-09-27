import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FieldLabelProps extends React.ComponentProps<'label'> {
  htmlFor: string;
  required?: boolean;
}

export function FieldLabel({ className, children, required, ...props }: FieldLabelProps) {
  return (
    <label
      className={cn('text-sm leading-none font-medium text-foreground select-none', className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-destructive">
          *
        </span>
      )}
    </label>
  );
}
