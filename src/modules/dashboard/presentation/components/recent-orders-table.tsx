'use client';

import * as React from 'react';
import { Inbox } from 'lucide-react';
import { StatusPill } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { DataTable, type DataTableColumn } from '@/components/organisms';
import { formatOrderStatus } from '@/modules/order/domain/value-objects/order-status';
import { type RecentOrder } from '../../domain/entities/recent-order';
import { orderStatusTone } from '../lib/dashboard-format';

export interface RecentOrdersTableProps {
  orders?: readonly RecentOrder[];
  isLoading?: boolean;
}

export function RecentOrdersTable({ orders, isLoading = false }: RecentOrdersTableProps) {
  const columns = React.useMemo<Array<DataTableColumn<RecentOrder>>>(
    () => [
      {
        id: 'orderNumber',
        header: 'Order ID',
        cell: (order) => (
          <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
        ),
      },
      {
        id: 'product',
        header: 'Product',
        cell: (order) => (
          <span className="font-medium text-foreground">{order.productSummary}</span>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'end',
        cell: (order) => (
          <span className="font-semibold text-foreground">{order.amount.format()}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (order) => (
          <StatusPill tone={orderStatusTone(order.status)}>
            {formatOrderStatus(order.status)}
          </StatusPill>
        ),
      },
      {
        id: 'time',
        header: 'Time',
        align: 'end',
        hideBelow: 'sm',
        cell: (order) => (
          <time dateTime={order.dateTimeAttribute} className="text-xs text-muted-foreground">
            {order.relativeTime()}
          </time>
        ),
      },
    ],
    []
  );

  return (
    <section aria-labelledby="dashboard-recent-orders" className="space-y-3">
      <h2
        id="dashboard-recent-orders"
        className="font-heading text-base font-semibold tracking-tight text-foreground"
      >
        Recent Orders
      </h2>

      <div className="rounded-2xl border border-border bg-card px-4 py-3 sm:px-5">
        <DataTable<RecentOrder>
          caption="Most recent orders, newest first"
          columns={columns}
          rows={orders ?? []}
          getRowId={(order) => order.id}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={<Inbox aria-hidden="true" />}
              title="No orders yet"
              description="Completed purchases will show up here as they come in."
              className="border-0 bg-transparent py-10"
            />
          }
        />
      </div>
    </section>
  );
}
