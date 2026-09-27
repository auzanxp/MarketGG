import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AppTopBarProps extends React.ComponentProps<'div'> {
  search?: React.ReactNode;
  actions?: React.ReactNode;
  user?: React.ReactNode;
}

export function AppTopBar({ search, actions, user, className, ...props }: AppTopBarProps) {
  return (
    <div className={cn('flex flex-1 items-center gap-3', className)} {...props}>
      {search && <div className="hidden min-w-0 flex-1 sm:block sm:max-w-sm">{search}</div>}

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {actions}
        {user}
      </div>
    </div>
  );
}
