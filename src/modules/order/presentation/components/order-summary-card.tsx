'use client';

import * as React from 'react';
import Image from 'next/image';
import { PriceSummary, type PriceSummaryRow } from '@/components/molecules';
import { type PriceBreakdown } from '@/shared/domain/price-breakdown';
import { cn } from '@/lib/utils';


export interface OrderSummaryLine {
  id: string;
  title: string;
  quantity: number;
  imageUrl: string;
  totalPriceLabel: string;
}

export interface OrderSummaryCardProps {
  lines: readonly OrderSummaryLine[];
  breakdown: PriceBreakdown;
  title?: string;
  taxLabel?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function OrderSummaryCard({
  lines,
  breakdown,
  title = 'Order Summary',
  taxLabel = breakdown.taxLabel,
  footer,
  className,
}: OrderSummaryCardProps) {
  const headingId = React.useId();

  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  const rows: readonly PriceSummaryRow[] = [
    { id: 'subtotal', label: 'Subtotal', value: breakdown.subtotal.format() },
    { id: 'tax', label: taxLabel, value: breakdown.tax.format() },
    { id: 'fee', label: 'Service Fee', value: breakdown.serviceFee.format() },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className={cn('rounded-2xl border border-border bg-card p-5', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id={headingId}
          className="font-heading text-base font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-3 border-b border-border pb-4">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-3">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={line.imageUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{line.title}</p>
              <p className="text-xs text-muted-foreground">
                <span aria-hidden="true">&times; {line.quantity}</span>
                <span className="sr-only">Quantity: {line.quantity}</span>
              </p>
            </div>

            <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {line.totalPriceLabel}
            </p>
          </li>
        ))}
      </ul>

      <PriceSummary
        rows={rows}
        total={{ label: 'Total', value: breakdown.total.format() }}
        className="mt-4"
      />

      {footer && <div className="mt-5">{footer}</div>}
    </section>
  );
}
