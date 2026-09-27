'use client';

import * as React from 'react';
import { PackageSearch, RotateCcw } from 'lucide-react';
import {
  AlertBanner,
  EmptyState,
  PageHeader,
  Pagination,
} from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { ROUTE_BUILDERS } from '@/shared/routes';
import { DEFAULT_PAGE_SIZE } from '../../application/use-cases/get-products.usecase';
import { useCatalogFilters } from '../hooks/use-catalog-filters';
import { useCategories, usePublishers } from '../hooks/use-catalog-taxonomy';
import { useProducts } from '../hooks/use-products';
import { CatalogFilters } from './catalog-filters';
import { ProductCard } from './product-card';

export function MarketplaceView() {
  const {
    searchInput,
    category,
    publisher,
    sort,
    view,
    filters,
    hasActiveFilters,
    setSearch,
    setCategory,
    setPublisher,
    setSort,
    setPage,
    setView,
    reset,
  } = useCatalogFilters();

  const products = useProducts(filters);
  const categories = useCategories();
  const publishers = usePublishers();

  const items = products.data?.items ?? [];
  const totalPages = products.data?.totalPages ?? 0;
  const total = products.data?.total ?? 0;

  // Keep previous results visible during refetch; skeletons are only for the initial load.
  const isInitialLoad = products.isPending;

  const gridClassName =
    view === 'list'
      ? 'flex flex-col gap-3'
      : 'grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Find your favorite games and digital products."
      />

      <CatalogFilters
        searchInput={searchInput}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories.data ?? []}
        publisher={publisher}
        onPublisherChange={setPublisher}
        publishers={publishers.data ?? []}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        isTaxonomyLoading={categories.isPending || publishers.isPending}
      />

      {(categories.isError || publishers.isError) && (
        <AlertBanner tone="error" title="Could not load product filters">
          <p>{categories.error?.message ?? publishers.error?.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              if (categories.isError) void categories.refetch();
              if (publishers.isError) void publishers.refetch();
            }}
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </AlertBanner>
      )}

      {products.isError && (
        <AlertBanner tone="error" title="Could not load products">
          <p>{products.error.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void products.refetch()}
            className="mt-2"
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </AlertBanner>
      )}

      {isInitialLoad && (
        <div className={gridClassName}>
          {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => (
            <ProductCard.Skeleton key={index} layout={view} />
          ))}
        </div>
      )}

      {!isInitialLoad && !products.isError && items.length === 0 && (
        <EmptyState
          icon={<PackageSearch aria-hidden="true" />}
          title="No products match your filters"
          description={
            hasActiveFilters
              ? 'Try a different search term, or widen the category and game filters.'
              : 'The catalogue is empty right now. Please check back shortly.'
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={reset} className="cursor-pointer">
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {!isInitialLoad && items.length > 0 && (
        <>
          {products.isFetching && (
            <p role="status" className="text-xs text-muted-foreground">Updating products…</p>
          )}
          <p aria-live="polite" className="text-xs text-muted-foreground">
            Showing {items.length} of {total} products
          </p>

          <div className={gridClassName} data-testid="product-grid" aria-busy={products.isFetching}>
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout={view}
                href={ROUTE_BUILDERS.productDetail(product.sku)}
              />
            ))}
          </div>

          <Pagination
            currentPage={products.data?.page ?? 1}
            totalPages={totalPages}
            onPageChange={(next) => {
              setPage(next);
              if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                try {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch {
                  // Scrolling is optional; a browser failure must not undo pagination.
                }
              }
            }}
            className="pt-2"
          />
        </>
      )}
    </div>
  );
}
