'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isAvailable?: boolean;
  matchPaths?: readonly string[];
}

export interface AppSidebarProps {
  items: readonly SidebarNavItem[];
  activePath: string;
  brand?: React.ReactNode;
  footer?: React.ReactNode;
  onUnavailableSelect?: (item: SidebarNavItem) => void;
  className?: string;
}

function matchesPrefix(activePath: string, prefix: string): boolean {
  if (prefix === '/') {
    return activePath === '/';
  }
  return activePath === prefix || activePath.startsWith(`${prefix}/`);
}

function isItemActive(activePath: string, item: SidebarNavItem): boolean {
  return (
    matchesPrefix(activePath, item.href) ||
    (item.matchPaths?.some((prefix) => matchesPrefix(activePath, prefix)) ?? false)
  );
}

const ITEM_BASE =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&_svg]:size-4.5 [&_svg]:shrink-0';

export function AppSidebar({
  items,
  activePath,
  brand,
  footer,
  onUnavailableSelect,
  className,
}: AppSidebarProps) {
  return (
    <div className={cn('flex h-full flex-col gap-6 bg-sidebar p-4', className)}>
      {brand && <div className="px-2 pt-2">{brand}</div>}

      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = isItemActive(activePath, item);
            const isAvailable = item.isAvailable !== false;

            return (
              <li key={item.href}>
                {isAvailable ? (
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      ITEM_BASE,
                      isActive
                        ? 'bg-primary-subtle text-primary'
                        : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUnavailableSelect?.(item)}
                    // Keep placeholders focusable so keyboard users can receive the explanation.
                    aria-disabled="true"
                    className={cn(
                      ITEM_BASE,
                      'text-muted-foreground/70 hover:bg-muted/60 hover:text-muted-foreground'
                    )}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                    <span className="sr-only">(coming soon)</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {footer && <div className="shrink-0 border-t border-sidebar-border pt-4">{footer}</div>}
    </div>
  );
}
