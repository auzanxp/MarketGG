import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE } from '../../../application/use-cases/get-products.usecase';
import {
  NO_FILTER,
  type CatalogSearchParams,
  loadCatalogSearchParams,
  productsQueryKey,
  toProductFilters,
} from '../catalog-search-params';

function params(overrides: Partial<CatalogSearchParams> = {}): CatalogSearchParams {
  return {
    q: '',
    category: NO_FILTER,
    publisher: NO_FILTER,
    sort: 'popular',
    page: 1,
    view: 'grid',
    ...overrides,
  };
}

describe('toProductFilters', () => {
  it('drops the "no filter" sentinel rather than forwarding it', () => {
    const filters = toProductFilters(params());

    expect(filters.query).toBeUndefined();
    expect(filters.category).toBeUndefined();
    expect(filters.publisher).toBeUndefined();
  });

  it('treats blank and whitespace-only input as absent', () => {
    const filters = toProductFilters(params({ q: '   ', category: '', publisher: '  ' }));

    expect(filters.query).toBeUndefined();
    expect(filters.category).toBeUndefined();
    expect(filters.publisher).toBeUndefined();
  });

  it('forwards real values, trimmed', () => {
    const filters = toProductFilters(
      params({ q: '  steam ', category: 'gift-cards', publisher: 'Steam', sort: 'price_asc', page: 3 })
    );

    expect(filters).toEqual({
      query: 'steam',
      category: 'gift-cards',
      publisher: 'Steam',
      sortBy: 'price_asc',
      page: 3,
      limit: DEFAULT_PAGE_SIZE,
    });
  });

  it('never produces a page below 1', () => {
    expect(toProductFilters(params({ page: 0 })).page).toBe(1);
    expect(toProductFilters(params({ page: -5 })).page).toBe(1);
  });

  it('excludes the layout preference', () => {
    const grid = toProductFilters(params({ view: 'grid' }));
    const list = toProductFilters(params({ view: 'list' }));

    expect(grid).toEqual(list);
    expect(grid).not.toHaveProperty('view');
  });
});

describe('productsQueryKey', () => {
  it('is stable for the same filters', () => {
    const a = productsQueryKey(toProductFilters(params({ category: 'games' })));
    const b = productsQueryKey(toProductFilters(params({ category: 'games' })));

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('matches between a bare URL and one carrying explicit defaults', () => {
    const bare = productsQueryKey(toProductFilters(params()));
    const explicitDefaults = productsQueryKey(
      toProductFilters(params({ category: NO_FILTER, publisher: NO_FILTER, view: 'list' }))
    );

    expect(JSON.stringify(bare)).toBe(JSON.stringify(explicitDefaults));
  });

  it('differs when a filter that affects results changes', () => {
    const popular = productsQueryKey(toProductFilters(params()));
    const cheapest = productsQueryKey(toProductFilters(params({ sort: 'price_asc' })));
    const page2 = productsQueryKey(toProductFilters(params({ page: 2 })));

    expect(JSON.stringify(popular)).not.toBe(JSON.stringify(cheapest));
    expect(JSON.stringify(popular)).not.toBe(JSON.stringify(page2));
  });
});

describe('loadCatalogSearchParams', () => {
  it('parses a shared URL into the same shape the client uses', async () => {
    const loaded = await loadCatalogSearchParams({
      q: 'diamonds',
      category: 'games',
      sort: 'rating',
      page: '2',
      view: 'list',
    });

    expect(loaded.q).toBe('diamonds');
    expect(loaded.category).toBe('games');
    expect(loaded.sort).toBe('rating');
    expect(loaded.page).toBe(2);
    expect(loaded.view).toBe('list');
    expect(loaded.publisher).toBe(NO_FILTER);
  });

  it('falls back to defaults for junk values instead of throwing', async () => {
    const loaded = await loadCatalogSearchParams({
      sort: 'not-a-sort-option',
      page: 'abc',
      view: 'carousel',
    });

    expect(loaded.sort).toBe('popular');
    expect(loaded.page).toBe(1);
    expect(loaded.view).toBe('grid');
  });
});
