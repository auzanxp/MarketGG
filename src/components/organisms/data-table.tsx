import * as React from 'react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';


export interface DataTableColumn<TRow> {
  id: string;
  header: React.ReactNode;
  cell: (row: TRow) => React.ReactNode;
  align?: 'start' | 'end';
  hideBelow?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface DataTableProps<TRow> {
  caption: string;
  columns: ReadonlyArray<DataTableColumn<TRow>>;
  rows: readonly TRow[];
  getRowId: (row: TRow) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  className?: string;
}

const HIDE_BELOW_CLASSES = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;

function columnClasses<TRow>(column: DataTableColumn<TRow>): string {
  return cn(
    column.align === 'end' ? 'text-right' : 'text-left',
    column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow],
    column.className
  );
}

export function DataTable<TRow>({
  caption,
  columns,
  rows,
  getRowId,
  isLoading = false,
  skeletonRows = 4,
  emptyState,
  className,
}: DataTableProps<TRow>) {
  const showEmptyState = !isLoading && rows.length === 0;

  if (showEmptyState && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn('relative w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  'px-3 py-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground first:pl-0 last:pr-0',
                  columnClasses(column)
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="border-b border-border/60 last:border-0">
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn('px-3 py-3.5 first:pl-0 last:pr-0', columnClasses(column))}
                    >
                      <Skeleton className="h-4 w-full max-w-28" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        'px-3 py-3.5 whitespace-nowrap first:pl-0 last:pr-0',
                        columnClasses(column)
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}

          {showEmptyState && !emptyState && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-sm text-muted-foreground"
              >
                No records to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
