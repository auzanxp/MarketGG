import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AuthSplitTemplateProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

export function AuthSplitTemplate({ children, aside, className }: AuthSplitTemplateProps) {
  return (
    <div className={cn('grid min-h-dvh lg:grid-cols-2', className)}>
      <main className="flex items-center justify-center bg-card px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[22rem]">{children}</div>
      </main>

      {aside ? (
        <aside
          aria-hidden="true"
          className="hidden items-center justify-center overflow-hidden bg-primary-subtle px-12 py-16 lg:flex"
        >
          {aside}
        </aside>
      ) : null}
    </div>
  );
}
