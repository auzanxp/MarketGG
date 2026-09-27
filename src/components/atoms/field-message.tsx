import * as React from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldMessageProps extends React.ComponentProps<'p'> {
  id: string;
  tone?: 'hint' | 'error';
}

export function FieldMessage({ id, tone = 'hint', className, children, ...props }: FieldMessageProps) {
  const isError = tone === 'error';

  return (
    <p
      id={id}
      {...(isError ? { role: 'alert' } : {})}
      className={cn(
        'flex items-start gap-1.5 text-xs leading-snug',
        isError ? 'font-medium text-destructive' : 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {isError && children ? (
        <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </p>
  );
}
