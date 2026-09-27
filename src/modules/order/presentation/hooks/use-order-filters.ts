'use client';

import { useQueryStates } from 'nuqs';
import { useDebouncedValue } from '@/shared/presentation/hooks/use-debounced-value';
import { DEFAULT_PAGE_SIZE } from '@/shared/domain/pagination';
import { orderSearchParams, ORDER_STATUS_FILTER_ALL } from '../lib/order-search-params';
import { type OrderStatus } from '../../domain/value-objects/order-status';

export function useOrderFilters() {
  const [params, setParams] = useQueryStates(orderSearchParams, { history: 'push', shallow: true });
  const query = useDebouncedValue(params.q, 350).trim();
  return {
    statusFilter: params.status,
    searchValue: params.q,
    filters: { status: params.status === ORDER_STATUS_FILTER_ALL ? undefined : params.status as OrderStatus, query: query || undefined, page: Math.max(1, params.page), limit: DEFAULT_PAGE_SIZE },
    hasActiveFilters: params.status !== ORDER_STATUS_FILTER_ALL || Boolean(params.q.trim()),
    setStatus: (status: typeof params.status) => { void setParams({ status, page: 1 }); },
    setSearch: (q: string) => { void setParams({ q, page: 1 }, { history: 'replace' }); },
    setPage: (page: number) => { void setParams({ page }); },
    clear: () => { void setParams({ status: ORDER_STATUS_FILTER_ALL, q: '', page: 1 }); },
  };
}
