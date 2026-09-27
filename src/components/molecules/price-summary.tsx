import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PriceSummaryRow {
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: 'default' | 'success';
}

export interface PriceSummaryProps extends React.ComponentProps<'dl'> {
  rows: readonly PriceSummaryRow[];
  total: { label: React.ReactNode; value: React.ReactNode };
  isLoading?: boolean;
}

export function PriceSummary({
  rows,
  total,
  isLoading = false,
  className,
  ...props
}: PriceSummaryProps) {
  return (
    <dl className={cn('flex flex-col gap-2.5 text-sm', className)} {...props}>
      {rows.map((row) => (
        <div key={row.id} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd
            className={cn(
              'font-medium tabular-nums',
              row.tone === 'success' ? 'text-success' : 'text-foreground'
            )}
          >
            {isLoading ? <span className="text-muted-foreground">&mdash;</span> : row.value}
          </dd>
        </div>
      ))}

      <div className="mt-1.5 flex items-baseline justify-between gap-4 border-t border-border pt-3.5">
        <dt className="text-sm font-semibold text-foreground">{total.label}</dt>
        <dd className="font-heading text-lg font-bold tabular-nums text-primary">
          {isLoading ? <span className="text-muted-foreground">&mdash;</span> : total.value}
        </dd>
      </div>
    </dl>
  );
}
