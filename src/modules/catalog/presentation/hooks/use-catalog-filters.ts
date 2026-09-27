'use client';

import * as React from 'react';
import { useQueryStates } from 'nuqs';
import { useDebouncedValue } from '@/shared/presentation/hooks/use-debounced-value';
import { type ProductSort } from '../../domain/repositories/product-repository.interface';
import {
  NO_FILTER,
  type CatalogSearchParams,
  catalogSearchParams,
  toProductFilters,
} from '../lib/catalog-search-params';
import { type ProductViewMode } from '@/components/molecules';

const SEARCH_DEBOUNCE_MS = 350;

// Update input and URL immediately; debounce only the query and reset page when filters change.
export function useCatalogFilters() {
  const [params, setParams] = useQueryStates(catalogSearchParams, {
    history: 'push',
    shallow: true,
  });

  const debouncedQuery = useDebouncedValue(params.q, SEARCH_DEBOUNCE_MS);

  const filters = React.useMemo(
    () => toProductFilters({ ...(params as CatalogSearchParams), q: debouncedQuery }),
    [params, debouncedQuery]
  );

  const setSearch = React.useCallback(
    (value: string) => {
      // Typing should not create one history entry per keystroke.
      void setParams({ q: value, page: 1 }, { history: 'replace' });
    },
    [setParams]
  );

  const setCategory = React.useCallback(
    (value: string) => void setParams({ category: value, page: 1 }),
    [setParams]
  );

  const setPublisher = React.useCallback(
    (value: string) => void setParams({ publisher: value, page: 1 }),
    [setParams]
  );

  const setSort = React.useCallback(
    (value: ProductSort) => void setParams({ sort: value, page: 1 }),
    [setParams]
  );

  const setPage = React.useCallback((value: number) => void setParams({ page: value }), [setParams]);

  const setView = React.useCallback(
    (value: ProductViewMode) => void setParams({ view: value }, { history: 'replace' }),
    [setParams]
  );

  const reset = React.useCallback(
    () =>
      void setParams({
        q: '',
        category: NO_FILTER,
        publisher: NO_FILTER,
        page: 1,
      }),
    [setParams]
  );

  const hasActiveFilters =
    params.q.trim().length > 0 || params.category !== NO_FILTER || params.publisher !== NO_FILTER;

  return {
    searchInput: params.q,
    category: params.category,
    publisher: params.publisher,
    sort: params.sort,
    page: params.page,
    view: params.view,
    filters,
    hasActiveFilters,
    setSearch,
    setCategory,
    setPublisher,
    setSort,
    setPage,
    setView,
    reset,
  };
}
