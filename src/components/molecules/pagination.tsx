'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PAGINATION_ELLIPSIS = 'ellipsis' as const;

export type PaginationItem = number | typeof PAGINATION_ELLIPSIS;

export function buildPaginationRange(
  currentPage: number,
  totalPages: number,
  siblings = 1
): PaginationItem[] {
  if (totalPages <= 0) {
    return [];
  }

  const maxVisible = siblings * 2 + 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const left = Math.max(currentPage - siblings, 1);
  const right = Math.min(currentPage + siblings, totalPages);

  // Show a single missing page rather than replacing it with an ellipsis.
  const showLeftEllipsis = left > 3;
  const showRightEllipsis = right < totalPages - 2;

  const windowStart = showLeftEllipsis ? Math.max(left, 2) : 2;
  const windowEnd = showRightEllipsis ? Math.min(right, totalPages - 1) : totalPages - 1;

  const items: PaginationItem[] = [1];

  if (showLeftEllipsis) {
    items.push(PAGINATION_ELLIPSIS);
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page);
  }

  if (showRightEllipsis) {
    items.push(PAGINATION_ELLIPSIS);
  }

  items.push(totalPages);

  return items;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblings?: number;
  className?: string;
}

const CONTROL_BASE =
  'flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40';

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblings = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPaginationRange(currentPage, totalPages, siblings);

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
        className={cn(CONTROL_BASE, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {items.map((item, index) =>
        item === PAGINATION_ELLIPSIS ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="flex size-9 items-end justify-center pb-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Go to page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={cn(
              CONTROL_BASE,
              item === currentPage
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
        className={cn(CONTROL_BASE, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
