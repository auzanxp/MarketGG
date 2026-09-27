'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../ui/sheet';
import { cn } from '@/lib/utils';

export interface AppShellTemplateProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShellTemplate({
  sidebar,
  topbar,
  children,
  className,
}: AppShellTemplateProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = React.useState(false);
  const [navPathname, setNavPathname] = React.useState(pathname);

  // Reset the drawer during navigation before committing the next screen.
  if (pathname !== navPathname) {
    setNavPathname(pathname);
    setIsNavOpen(false);
  }

  return (
    <div className={cn('flex min-h-dvh bg-background', className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-dvh">{sidebar}</div>
      </aside>

      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Move between sections of VocaMarket.
          </SheetDescription>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          role="banner"
          className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 backdrop-blur-md sm:px-6 bg-white"
        >
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={isNavOpen}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          {topbar}
        </header>

        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
