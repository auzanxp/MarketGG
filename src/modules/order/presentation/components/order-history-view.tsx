'use client';

import { useOrderFilters } from '../hooks/use-order-filters';
import { useOrders } from '../hooks/use-orders';
import { OrderHistoryPanel, type OrderHistoryRow } from './order-history-panel';

export function OrderHistoryView() {
  const filters = useOrderFilters();
  const query = useOrders(filters.filters);
  const rows: readonly OrderHistoryRow[] = (query.data?.items ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.createdAt,
    breakdown: order.priceBreakdown,
    totalLabel: order.totalAmount.format(),
    productSummary: order.items.map((item) => item.quantity > 1 ? item.title + ' (x' + item.quantity + ')' : item.title).join(', '),
    lines: order.items.map((item) => ({
      id: item.productId, title: item.title, quantity: item.quantity, imageUrl: item.imageUrl, totalPriceLabel: item.totalPrice.format(),
    })),
  }));
  return (
    <OrderHistoryPanel
      rows={rows}
      page={query.data?.page ?? filters.filters.page}
      totalPages={query.data?.totalPages ?? 1}
      total={query.data?.total ?? 0}
      onPageChange={filters.setPage}
      statusFilter={filters.statusFilter}
      onStatusFilterChange={filters.setStatus}
      searchValue={filters.searchValue}
      onSearchChange={filters.setSearch}
      hasActiveFilters={filters.hasActiveFilters}
      onClearFilters={filters.clear}
      isLoading={query.isPending}
      errorMessage={query.error?.message}
      onRetry={() => void query.refetch()}
    />
  );
}
