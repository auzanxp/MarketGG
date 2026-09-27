import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, ContractMismatchError, NotFoundError, UnexpectedError } from '@/shared/domain/errors';
import { HttpResponse, http as mswHttp } from 'msw';
import { server } from '../server';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { FetchHttpClient } from '@/shared/infrastructure/http/fetch-http-client';
import { mapApiErrorToDomainError } from '@/shared/infrastructure/http/map-api-error';
import { DEFAULT_PAGE_SIZE } from '@/modules/catalog/application/use-cases/get-products.usecase';
import { type GetCategoriesUseCase } from '@/modules/catalog/application/use-cases/get-categories.usecase';
import { type GetProductDetailUseCase } from '@/modules/catalog/application/use-cases/get-product-detail.usecase';
import { type GetProductsUseCase } from '@/modules/catalog/application/use-cases/get-products.usecase';
import { type GetPublishersUseCase } from '@/modules/catalog/application/use-cases/get-publishers.usecase';
import { LocalMockProductRepository } from '@/modules/catalog/infrastructure/repositories/local-mock-product.repository';
import { mockDb } from '../db/mock-db';
import { CookieSessionStore } from '@/shared/infrastructure/storage/cookie-session-store';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';

describe('Catalog (real DI graph + MSW)', () => {
  let getProducts: GetProductsUseCase;
  let getProductDetail: GetProductDetailUseCase;
  let getCategories: GetCategoriesUseCase;
  let getPublishers: GetPublishersUseCase;

  beforeEach(() => {
    const container = createContainer();
    getProducts = container.resolve<GetProductsUseCase>(TOKENS.GetProductsUseCase);
    getProductDetail = container.resolve<GetProductDetailUseCase>(TOKENS.GetProductDetailUseCase);
    getCategories = container.resolve<GetCategoriesUseCase>(TOKENS.GetCategoriesUseCase);
    getPublishers = container.resolve<GetPublishersUseCase>(TOKENS.GetPublishersUseCase);
  });

  describe('listing', () => {
    it('returns a page of rich domain entities', async () => {
      const result = await getProducts.execute();

      expect(result.isSuccess).toBe(true);
      const page = result.value;

      expect(page.items).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(page.page).toBe(1);
      expect(page.total).toBeGreaterThan(DEFAULT_PAGE_SIZE);
      expect(page.totalPages).toBe(Math.ceil(page.total / DEFAULT_PAGE_SIZE));

      const [first] = page.items;
      expect(first.price.format()).toMatch(/^\$/);
      expect(typeof first.isAvailable(1)).toBe('boolean');
      expect(first.publisher.length).toBeGreaterThan(0);
    });

    it('defaults to the popular sort, matching the design', async () => {
      const page = (await getProducts.execute()).value;

      expect(page.items[0].title).toBe('MLBB 86 Diamonds');
      const soldCounts = page.items.map((product) => product.soldCount);
      expect([...soldCounts].sort((a, b) => b - a)).toEqual(soldCounts);
    });

    it('paginates without repeating or losing a product', async () => {
      const first = (await getProducts.execute({ page: 1 })).value;
      const second = (await getProducts.execute({ page: 2 })).value;

      const ids = [...first.items, ...second.items].map((product) => product.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('clamps a page beyond the end to the last page', async () => {
      const page = (await getProducts.execute({ page: 99 })).value;

      expect(page.page).toBe(page.totalPages);
      expect(page.items.length).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    it('searches for the literal word all instead of returning the whole catalog', async () => {
      const all = (await getProducts.execute()).value;
      const matches = (await getProducts.execute({ query: ' all ' })).value;

      expect(matches.total).toBeGreaterThan(0);
      expect(matches.total).toBeLessThan(all.total);
      expect(matches.items.every((product) =>
        `${product.title} ${product.publisher} ${product.description} ${product.sku}`.toLowerCase().includes('all')
      )).toBe(true);
    });
    it('matches on title', async () => {
      const page = (await getProducts.execute({ query: 'diamonds' })).value;

      expect(page.items.length).toBeGreaterThan(0);
      expect(
        page.items.every((product) => product.title.toLowerCase().includes('diamonds'))
      ).toBe(true);
    });

    it('matches on publisher, so searching a game finds its top-ups', async () => {
      const page = (await getProducts.execute({ query: 'Netflix' })).value;

      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items[0].publisher).toBe('Netflix');
    });

    it('returns an empty page rather than an error for no matches', async () => {
      const page = (await getProducts.execute({ query: 'definitely-not-a-product' })).value;

      expect(page.items).toEqual([]);
      expect(page.total).toBe(0);
    });
  });

  describe('filtering', () => {
    it('filters by category slug', async () => {
      const page = (await getProducts.execute({ category: 'gift-cards' })).value;

      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.every((product) => product.category === 'Gift Cards')).toBe(true);
    });

    it('returns nothing for an unknown category slug', async () => {
      const page = (await getProducts.execute({ category: 'not-a-category' })).value;

      expect(page.total).toBe(0);
    });

    it('filters by publisher', async () => {
      const page = (await getProducts.execute({ publisher: 'Roblox' })).value;

      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.every((product) => product.publisher === 'Roblox')).toBe(true);
    });

    it('treats the "all" sentinel as no filter at all', async () => {
      const sentinel = (await getProducts.execute({ category: 'all', publisher: 'all' })).value;
      const unfiltered = (await getProducts.execute()).value;

      expect(sentinel.total).toBe(unfiltered.total);
    });
  });

  describe('sorting', () => {
    it('orders by price ascending', async () => {
      const page = (await getProducts.execute({ sortBy: 'price_asc' })).value;
      const amounts = page.items.map((product) => product.price.amount);

      expect([...amounts].sort((a, b) => a - b)).toEqual(amounts);
    });

    it('orders by price descending', async () => {
      const page = (await getProducts.execute({ sortBy: 'price_desc' })).value;
      const amounts = page.items.map((product) => product.price.amount);

      expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
    });

    it('orders by rating', async () => {
      const page = (await getProducts.execute({ sortBy: 'rating' })).value;
      const ratings = page.items.map((product) => product.rating ?? 0);

      expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
    });

    it('is stable, so paginating cannot show the same product twice', async () => {
      const firstRun = (await getProducts.execute({ sortBy: 'rating' })).value;
      const secondRun = (await getProducts.execute({ sortBy: 'rating' })).value;

      expect(firstRun.items.map((p) => p.id)).toEqual(secondRun.items.map((p) => p.id));
    });
  });

  describe('taxonomy', () => {
    it('returns categories with catalogue-wide counts', async () => {
      const result = await getCategories.execute();

      expect(result.isSuccess).toBe(true);
      const categories = result.value;

      expect(categories.map((category) => category.slug)).toEqual([
        'games',
        'mobile-topup',
        'gift-cards',
        'entertainment',
      ]);
      expect(categories[0].itemCountLabel).toBe('1,245 items');
    });

    it('returns distinct publishers, alphabetically', async () => {
      const publishers = (await getPublishers.execute()).value;

      expect(new Set(publishers).size).toBe(publishers.length);
      expect([...publishers].sort((a, b) => a.localeCompare(b))).toEqual(publishers);
      expect(publishers).toContain('Mobile Legends');
    });
  });

  describe('product detail', () => {
    it.each([
      { stock: 1.5 },
      { stock: -1 },
      { price: { amount: -1, currency: 'USD' } },
      { price: { amount: 1, currency: 'invalid' } },
    ])('rejects malformed product values: %j', async (invalid) => {
      server.use(mswHttp.get('*/api/v1/products/sku/MLBB-DIAMOND-086', () =>
        HttpResponse.json({ ...mockDb.getProductById('prod-1'), ...invalid })
      ));
      const result = await getProductDetail.execute('MLBB-DIAMOND-086');
      expect(result.error).toBeInstanceOf(ContractMismatchError);
    });

    it('rejects fractional pagination metadata', async () => {
      const payload = mockDb.getProducts();
      server.use(mswHttp.get('*/api/v1/products', () =>
        HttpResponse.json({ items: payload.items, meta: { ...payload, total: 1.5 } })
      ));
      expect((await getProducts.execute()).error).toBeInstanceOf(ContractMismatchError);
    });

    it('returns a single product', async () => {
      const result = await getProductDetail.execute('MLBB-DIAMOND-086');

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('prod-1');
      expect(result.value.sku).toBe('MLBB-DIAMOND-086');
      expect(result.value.title).toBe('MLBB 86 Diamonds');
      expect(result.value.price.format()).toBe('$1.25');
    });

    it.each(['missing-sku', 'prod-1', 'mlbb-diamond-086'])('maps an unmatched SKU %s to NotFoundError', async (sku) => {
      const result = await getProductDetail.execute(sku);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
    });

    it('trims surrounding whitespace without changing SKU capitalization', async () => {
      const result = await getProductDetail.execute('  MLBB-DIAMOND-086  ');
      expect(result.value.id).toBe('prod-1');
    });

    it('resolves the same SKU in the server mock adapter', async () => {
      const repository = new LocalMockProductRepository();
      const result = await repository.getProductBySku('MLBB-DIAMOND-086');
      expect(result.value.id).toBe('prod-1');
      expect(result.value.price.format()).toBe('$1.25');
      expect((await repository.getProductBySku('prod-1')).error).toBeInstanceOf(NotFoundError);
    });

    it('rejects an empty SKU before touching the repository', async () => {
      const lookup = vi.spyOn(mockDb, 'getProductBySku');
      const result = await getProductDetail.execute('   ');

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe('VALIDATION');
      expect(lookup).not.toHaveBeenCalled();
      lookup.mockRestore();
    });
  });

  describe('checkout', () => {
    beforeEach(async () => {
      const login = createContainer().resolve<LoginUseCase>(TOKENS.LoginUseCase);
      await login.execute({ email: 'john.doe@example.com', password: 'password123' });
    });
    const BILLING = {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 234 567 8909',
    };

    function http() {
      return new FetchHttpClient({ baseUrl: 'http://localhost:3000/api/v1', getAccessToken: () => new CookieSessionStore().getAccessToken() });
    }

    it('returns 409 with usable meta when stock is short', async () => {
      const error = await http()
        .post('/orders/checkout', {
          items: [{ productId: 'prod-16', quantity: 3 }],
          paymentMethod: 'CARD',
          billingInfo: BILLING,
        })
        .then(() => null)
        .catch((caught: unknown) => mapApiErrorToDomainError(caught));

      expect(error).toBeInstanceOf(ConflictError);
      expect((error as ConflictError).meta).toMatchObject({
        productId: 'prod-16',
        availableStock: 2,
        requestedQuantity: 3,
      });
    });

    it('rejects incomplete billing information with field errors', async () => {
      const error = await http()
        .post('/orders/checkout', {
          items: [{ productId: 'prod-1', quantity: 1 }],
          billingInfo: { fullName: '', email: '', phone: '' },
          paymentMethod: 'CARD',
        })
        .then(() => null)
        .catch((caught: unknown) => mapApiErrorToDomainError(caught));

      expect(error?.code).toBe('VALIDATION');
    });

    it('decrements stock atomically on success', async () => {
      const before = mockDb.getProductById('prod-1')!.stock;

      const response = await http().post<{ order: { status: string; orderNumber: string } }>(
        '/orders/checkout',
        { items: [{ productId: 'prod-1', quantity: 2 }], billingInfo: BILLING, paymentMethod: 'CARD' }
      );

      expect(response.status).toBe(201);
      expect(response.data.order.status).toBe('COMPLETED');
      expect(response.data.order.orderNumber).toMatch(/^INV-/);
      expect(mockDb.getProductById('prod-1')!.stock).toBe(before - 2);
    });

    it('leaves stock untouched when the request is rejected', async () => {
      const before = mockDb.getProductById('prod-16')!.stock;

      await http()
        .post('/orders/checkout', {
          items: [{ productId: 'prod-16', quantity: 3 }],
          paymentMethod: 'CARD',
          billingInfo: BILLING,
        })
        .catch(() => undefined);

      expect(mockDb.getProductById('prod-16')!.stock).toBe(before);
    });
  });

  describe('failure injection', () => {
    it('surfaces ?__chaos=500 as an UnexpectedError', async () => {
      const http = new FetchHttpClient({ baseUrl: 'http://localhost:3000/api/v1' });

      const error = await http
        .get('/products?__chaos=500')
        .then(() => null)
        .catch((caught: unknown) => mapApiErrorToDomainError(caught));

      expect(error).toBeInstanceOf(UnexpectedError);
    });
  });
});
