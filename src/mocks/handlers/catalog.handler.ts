import { http, HttpResponse } from 'msw';
import { type ProductDto, type ProductListResponseDto, type CategoryListResponseDto, type PublisherListResponseDto } from '@/modules/catalog/infrastructure/schemas/product.schema';
import { toPaginatedResponse } from '@/shared/infrastructure/http/pagination';
import { mockDb, type ProductSortKey } from '../db/mock-db';
import { chaosResponse, problem, simulateLatency } from '../support/simulation';

const SORT_KEYS: readonly ProductSortKey[] = [
  'popular',
  'newest',
  'price_asc',
  'price_desc',
  'rating',
];

function parseSortKey(value: string | null): ProductSortKey {
  return SORT_KEYS.includes(value as ProductSortKey) ? (value as ProductSortKey) : 'popular';
}

export const catalogHandlers = [
  http.get('*/api/v1/products', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency();

    const url = new URL(request.url);
    const result = mockDb.getProducts({
      query: url.searchParams.get('q') || undefined,
      category: url.searchParams.get('category') || undefined,
      publisher: url.searchParams.get('publisher') || undefined,
      sortBy: parseSortKey(url.searchParams.get('sortBy')),
      page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : undefined,
      limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
    });

    return HttpResponse.json<ProductListResponseDto>(toPaginatedResponse(result));
  }),

  http.get('*/api/v1/categories', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency();

    return HttpResponse.json<CategoryListResponseDto>({ items: mockDb.getCategories() });
  }),

  http.get('*/api/v1/publishers', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency();

    return HttpResponse.json<PublisherListResponseDto>({ items: mockDb.getPublishers() });
  }),

  http.get('*/api/v1/products/sku/:sku', async ({ params, request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency();

    const sku = String(params.sku);
    const product = mockDb.getProductBySku(sku);

    if (!product) {
      return problem(404, {
        type: 'not-found',
        title: 'Product Not Found',
        detail: `Product with SKU '${sku}' was not found in catalog.`,
      });
    }

    return HttpResponse.json<ProductDto>(product);
  }),

  http.get('*/api/v1/products/:id', async ({ params, request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency();

    const id = String(params.id);
    const product = mockDb.getProductById(id);

    if (!product) {
      return problem(404, {
        type: 'not-found',
        title: 'Product Not Found',
        detail: `Product with ID '${id}' was not found in catalog.`,
      });
    }

    return HttpResponse.json<ProductDto>(product);
  }),
];
