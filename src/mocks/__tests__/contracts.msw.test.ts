import { beforeEach, describe, expect, it } from 'vitest';
import { type z } from 'zod';
import { mockDb } from '../db/mock-db';
import { CategoryListResponseSchema, ProductDtoSchema, ProductListResponseSchema, PublisherListResponseSchema } from '@/modules/catalog/infrastructure/schemas/product.schema';
import { CheckoutResponseSchema, OrderDtoSchema, OrderListResponseSchema } from '@/modules/order/infrastructure/schemas/order.schema';
import { LoginResponseSchema, UserDtoSchema } from '@/modules/identity/infrastructure/schemas/auth.schema';
import { DashboardSummaryResponseSchema } from '@/modules/dashboard/infrastructure/schemas/dashboard.schema';
import { ProblemDetailsSchema } from '@/shared/infrastructure/http/problem-details';

const BASE = 'http://localhost:3000/api/v1';
const checkout = { items: [{ productId: 'prod-1', quantity: 1 }], billingInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '+12345678900' }, paymentMethod: 'CARD' };

describe('Mock API contracts', () => {
  let headers: Record<string, string>;
  beforeEach(() => { headers = { Authorization: `Bearer ${mockDb.issueTokens('usr-101').accessToken}`, 'Content-Type': 'application/json' }; });

  it.each<[string, z.ZodType]>([
    ['/products', ProductListResponseSchema], ['/products/prod-1', ProductDtoSchema],
    ['/products/sku/MLBB-DIAMOND-086', ProductDtoSchema],
    ['/categories', CategoryListResponseSchema], ['/publishers', PublisherListResponseSchema],
    ['/auth/me', UserDtoSchema], ['/dashboard/summary', DashboardSummaryResponseSchema],
    ['/orders', OrderListResponseSchema], ['/orders/ord-202600017', OrderDtoSchema],
  ])('validates GET %s', async (endpoint, schema) => {
    const response = await fetch(BASE + endpoint, { headers });
    expect(response.status).toBe(200);
    expect(schema.safeParse(await response.json()).success).toBe(true);
  });

  it('validates login, checkout and the empty logout response', async () => {
    const login = await fetch(BASE + '/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'john.doe@example.com', password: 'password123' }) });
    expect(LoginResponseSchema.safeParse(await login.json()).success).toBe(true);
    const order = await fetch(BASE + '/orders/checkout', { method: 'POST', headers, body: JSON.stringify(checkout) });
    expect(order.status).toBe(201);
    expect(CheckoutResponseSchema.safeParse(await order.json()).success).toBe(true);
    const logout = await fetch(BASE + '/auth/logout', { method: 'POST', headers });
    expect(logout.status).toBe(204);
    expect(await logout.text()).toBe('');
  });

  it.each([400, 401, 403, 404, 409, 422, 429, 500, 503])('validates simulated %s errors', async (status) => {
    const response = await fetch(`${BASE}/products?__chaos=${status}`);
    expect(response.status).toBe(status);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(ProblemDetailsSchema.parse(await response.json()).status).toBe(status);
  });

  it('validates real malformed-body, unauthorized, missing-product and validation errors', async () => {
    const responses = await Promise.all([
      fetch(BASE + '/auth/login', { method: 'POST', headers, body: '{broken' }),
      fetch(BASE + '/orders'), fetch(BASE + '/products/missing'),
      fetch(BASE + '/products/sku/missing'),
      fetch(BASE + '/orders/checkout', { method: 'POST', headers, body: '{}' }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([400, 401, 404, 404, 422]);
    for (const response of responses) expect(ProblemDetailsSchema.parse(await response.json()).status).toBe(response.status);
  });

  it('includes usable stock conflict and retry metadata in the error contract', async () => {
    const conflict = await fetch(BASE + '/orders/checkout', { method: 'POST', headers, body: JSON.stringify({ ...checkout, items: [{ productId: 'prod-16', quantity: 3 }] }) });
    expect(ProblemDetailsSchema.parse(await conflict.json())).toMatchObject({ status: 409, meta: { availableStock: 2, requestedQuantity: 3 } });
    let throttle!: Response;
    for (let attempt = 0; attempt < 5; attempt++) throttle = await fetch(BASE + '/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'john.doe@example.com', password: 'wrong' }) });
    const problem = ProblemDetailsSchema.parse(await throttle.json());
    expect(problem).toMatchObject({ status: 429, meta: { retryAfterSeconds: 30 } });
    expect(throttle.headers.get('Retry-After')).toBe('30');
  });

  it.each(['/products', '/orders'])('normalises pagination and empty results on %s', async (endpoint) => {
    const cases = [
      ['', { page: 1, limit: 8 }], ['?page=-1&limit=0', { page: 1, limit: 1 }],
      ['?page=1.9&limit=2.9', { page: 1, limit: 2 }], ['?page=invalid&limit=invalid', { page: 1, limit: 8 }],
      ['?page=Infinity&limit=Infinity', { page: 1, limit: 8 }], ['?limit=1000', { page: 1, limit: 48 }],
    ] as const;
    for (const [query, meta] of cases) {
      const response = await fetch(BASE + endpoint + query, { headers });
      const schema = endpoint === '/products' ? ProductListResponseSchema : OrderListResponseSchema;
      expect(schema.parse(await response.json()).meta).toMatchObject(meta);
    }
    const empty = await fetch(BASE + endpoint + '?q=zzzznotathing&page=99', { headers });
    expect(await empty.json()).toEqual({ items: [], meta: { total: 0, page: 1, limit: 8, totalPages: 1 } });
  });

  it('paginates owned orders after search and status filtering', async () => {
    const pages = [];
    for (const page of [1, 2, 99]) {
      const response = await fetch(`${BASE}/orders?page=${page}&limit=2`, { headers });
      pages.push(OrderListResponseSchema.parse(await response.json()));
    }
    expect(pages[0].items.map((order) => order.id)).toEqual(['ord-202600017', 'ord-202600016']);
    expect(pages[1].items.map((order) => order.id)).toEqual(['ord-202600015', 'ord-202600014']);
    expect(pages[2].items.map((order) => order.id)).toEqual(['ord-202600013', 'ord-202600012']);
    expect(pages[2].meta).toEqual({ total: 6, page: 3, limit: 2, totalPages: 3 });
    expect(new Set(pages.flatMap((page) => page.items.map((order) => order.id))).size).toBe(6);
    const filtered = await fetch(BASE + '/orders?status=COMPLETED&q=Gift&limit=1', { headers });
    expect(OrderListResponseSchema.parse(await filtered.json())).toMatchObject({ items: [{ id: 'ord-202600014' }], meta: { total: 1, page: 1, totalPages: 1 } });
    const janeHeaders = { Authorization: `Bearer ${mockDb.issueTokens('usr-102').accessToken}` };
    const jane = await fetch(BASE + '/orders?page=99&limit=2', { headers: janeHeaders });
    expect(await jane.json()).toEqual({ items: [], meta: { total: 0, page: 1, limit: 2, totalPages: 1 } });
  });
});
