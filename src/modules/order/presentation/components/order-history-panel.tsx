'use client';

import * as React from 'react';
import { ReceiptText, RotateCcw } from 'lucide-react';

import { ButtonLink, StatusPill } from '@/components/atoms';
import {
  AlertBanner,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchField,
} from '@/components/molecules';
import { DataTable, type DataTableColumn } from '@/components/organisms';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/shared/routes';
import { formatOrderStatus } from '../../domain/value-objects/order-status';
import {
  formatOrderDateTime,
  orderStatusTone,
  toDateTimeAttribute,
} from '../lib/order-format';
import {
  ORDER_STATUS_TAB_ITEMS,
  type OrderStatusFilter,
} from '../lib/order-search-params';
import { OrderReceiptDialog, type OrderReceipt } from './order-receipt-dialog';


export interface OrderHistoryRow extends OrderReceipt {
  productSummary: string;
  totalLabel: string;
}

export interface OrderHistoryPanelProps {
  rows: readonly OrderHistoryRow[];
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  statusFilter: OrderStatusFilter;
  onStatusFilterChange: (value: OrderStatusFilter) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isLoading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export function OrderHistoryPanel({
  rows,
  page,
  totalPages,
  total,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  searchValue,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  isLoading = false,
  errorMessage,
  onRetry,
}: OrderHistoryPanelProps) {
  const [openReceipt, setOpenReceipt] = React.useState<OrderReceipt | null>(null);

  const columns: ReadonlyArray<DataTableColumn<OrderHistoryRow>> = [
    {
      id: 'orderNumber',
      header: 'Order ID',
      cell: (row) => (
        <span className="font-mono text-xs font-medium text-foreground">{row.orderNumber}</span>
      ),
    },
    {
      id: 'product',
      header: 'Product',
      cell: (row) => (
        <span className="block max-w-[18rem] truncate text-sm text-foreground">
          {row.productSummary}
        </span>
      ),
      className: 'min-w-[10rem]',
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (row) => (
        <span className="text-sm font-semibold tabular-nums text-foreground">{row.totalLabel}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusPill tone={orderStatusTone(row.status)} >
          {formatOrderStatus(row.status)}
        </StatusPill>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      hideBelow: 'md',
      cell: (row) => (
        <time
          dateTime={toDateTimeAttribute(row.placedAt)}
          className="text-xs text-muted-foreground"
        >
          {formatOrderDateTime(row.placedAt)}
        </time>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'end',
      cell: (row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpenReceipt(row)}
          aria-label={`View order ${row.orderNumber}`}
          className="font-semibold bg-white text-primary cursor-pointer"
        >
          View
        </Button>
      ),
    },
  ];

  const emptyState = hasActiveFilters ? (
    <EmptyState
      icon={<ReceiptText />}
      title="No orders match your filters"
      description="Try a different status, or clear the search term."
      action={
        <Button type="button" variant="outline" size="sm" onClick={onClearFilters} className="cursor-pointer">
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<ReceiptText />}
      title="No orders yet"
      description="Once you complete a purchase it will show up here with its status and receipt."
      action={<ButtonLink href={ROUTES.marketplace}>Browse marketplace</ButtonLink>}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order History"
        description="View all your transactions and order status."
      />

      {errorMessage && (
        <AlertBanner tone="error" title="Could not load your orders">
          <p>{errorMessage}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          )}
        </AlertBanner>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            label="Filter orders by status"
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            items={ORDER_STATUS_TAB_ITEMS}
          />

          <SearchField
            label="Search order ID or product"
            placeholder="Search order ID or product..."
            value={searchValue}
            onValueChange={onSearchChange}
            size="md"
            className="lg:w-72"
          />
        </div>

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? 'Loading orders'
            : `${rows.length} of ${total} orders shown, page ${page} of ${totalPages}`}
        </p>

        <DataTable
          caption="Your order history"
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          skeletonRows={5}
          emptyState={errorMessage ? <p className="text-sm text-muted-foreground">Orders are unavailable. Try again above.</p> : emptyState}
        />
        {!isLoading && !errorMessage && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} className="mt-4" />
        )}
      </div>

      <OrderReceiptDialog order={openReceipt} onClose={() => setOpenReceipt(null)} />
    </div>
  );
}
