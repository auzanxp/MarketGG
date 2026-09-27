import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  as?: 'h1' | 'h2';
}

export function PageHeader({
  title,
  description,
  action,
  as: Heading = 'h1',
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn('flex flex-wrap items-start justify-between gap-4', className)}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        <Heading className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </Heading>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
