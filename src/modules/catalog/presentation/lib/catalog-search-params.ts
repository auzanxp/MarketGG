import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs/server';
import { DEFAULT_PAGE_SIZE } from '../../application/use-cases/get-products.usecase';
import {
  PRODUCT_SORT_OPTIONS,
  type ProductFilters,
} from '../../domain/repositories/product-repository.interface';

export const NO_FILTER = 'all';

export const VIEW_MODES = ['grid', 'list'] as const;

export const catalogSearchParams = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault(NO_FILTER),
  publisher: parseAsString.withDefault(NO_FILTER),
  sort: parseAsStringLiteral(PRODUCT_SORT_OPTIONS).withDefault('popular'),
  page: parseAsInteger.withDefault(1),
  view: parseAsStringLiteral(VIEW_MODES).withDefault('grid'),
};

export type CatalogSearchParams = {
  q: string;
  category: string;
  publisher: string;
  sort: (typeof PRODUCT_SORT_OPTIONS)[number];
  page: number;
  view: (typeof VIEW_MODES)[number];
};

export const loadCatalogSearchParams = createLoader(catalogSearchParams);

export function toProductFilters(params: CatalogSearchParams): ProductFilters {
  const query = params.q.trim();
  const category = params.category.trim();
  const publisher = params.publisher.trim();

  return {
    query: query.length > 0 ? query : undefined,
    category: category.length > 0 && category !== NO_FILTER ? category : undefined,
    publisher: publisher.length > 0 && publisher !== NO_FILTER ? publisher : undefined,
    sortBy: params.sort,
    page: Math.max(1, params.page),
    limit: DEFAULT_PAGE_SIZE,
  };
}

// SSR prefetch and client subscriptions must use the same key.
export function productsQueryKey(filters: ProductFilters) {
  return ['catalog', 'products', filters] as const;
}

export const CATEGORIES_QUERY_KEY = ['catalog', 'categories'] as const;
export const PUBLISHERS_QUERY_KEY = ['catalog', 'publishers'] as const;
