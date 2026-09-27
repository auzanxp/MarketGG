import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../server';
import { mockDb } from '../db/mock-db';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { type CheckoutUseCase } from '@/modules/order/application/use-cases/checkout.usecase';
import { type GetOrdersUseCase } from '@/modules/order/application/use-cases/get-orders.usecase';
import { type GetOrderDetailUseCase } from '@/modules/order/application/use-cases/get-order-detail.usecase';
import { type CheckoutInput } from '@/modules/order/domain/repositories/order-repository.interface';
import { type IHttpClient } from '@/shared/infrastructure/http/http-client.interface';

const INPUT: CheckoutInput = {
  items: [{ productId: 'prod-1', quantity: 2 }],
  billingInfo: { fullName: 'John Doe', email: 'john.doe@example.com', phone: '+1 234 567 8900' },
  paymentMethod: 'EWALLET',
};

describe('Orders (real DI + MSW)', () => {
  let checkout: CheckoutUseCase;
  let orders: GetOrdersUseCase;
  let detail: GetOrderDetailUseCase;
  let login: LoginUseCase;
  let client: IHttpClient;
  beforeEach(async () => {
    const container = createContainer();
    checkout = container.resolve(TOKENS.CheckoutUseCase);
    orders = container.resolve(TOKENS.GetOrdersUseCase);
    detail = container.resolve(TOKENS.GetOrderDetailUseCase);
    login = container.resolve(TOKENS.LoginUseCase);
    client = container.resolve(TOKENS.HttpClient);
    await login.execute({ email: 'john.doe@example.com', password: 'password123' });
  });

  it('creates a receipt with server totals, stock reduction and a searchable history entry', async () => {
    const stock = mockDb.getProductById('prod-1')!.stock;
    const order = (await checkout.execute(INPUT)).value;
    expect(order.status).toBe('COMPLETED');
    expect(order.paymentMethod).toBe('EWALLET');
    expect(order.totalAmount.format()).toBe('$3.28');
    expect(order.priceBreakdown.total.amount).toBe(order.totalAmount.amount);
    expect(order.billingInfo.email.value).toBe(INPUT.billingInfo.email);
    expect(mockDb.getProductById('prod-1')!.stock).toBe(stock - 2);
    expect((await detail.execute(order.id)).value.totalAmount.amount).toBe(3.28);
    expect((await orders.execute({ query: order.orderNumber })).value.items.map((row) => row.id)).toEqual([order.id]);
    expect((await orders.execute({ status: 'FAILED' })).value.items.every((row) => row.status === 'FAILED')).toBe(true);
  });

  it('keeps historic receipt amounts instead of applying the current pricing policy', async () => {
    const raw = mockDb.getOrders()[0];
    raw.priceBreakdown.tax.amount = 0.2;
    raw.priceBreakdown.serviceFee.amount = 0.1;
    raw.totalAmount.amount = 1.55;
    server.use(http.get('*/api/v1/orders/:id', () => HttpResponse.json(raw)));
    const order = (await detail.execute(raw.id)).value;
    expect(order.priceBreakdown.tax.amount).toBe(0.2);
    expect(order.totalAmount.amount).toBe(1.55);
  });

  it('rejects mismatched receipt totals as a contract error', async () => {
    const raw = mockDb.getOrders()[0];
    raw.totalAmount.amount = 0;
    server.use(http.get('*/api/v1/orders/:id', () => HttpResponse.json(raw)));
    expect((await detail.execute(raw.id)).error.code).toBe('CONTRACT_MISMATCH');
  });

  it('does not partially reduce stock when a later item conflicts', async () => {
    const stock = mockDb.getProductById('prod-1')!.stock;
    const count = mockDb.getOrders().length;
    const result = await checkout.execute({ ...INPUT, items: [{ productId: 'prod-1', quantity: 1 }, { productId: 'missing', quantity: 1 }] });
    expect(result.error.code).toBe('CONFLICT');
    expect(mockDb.getProductById('prod-1')!.stock).toBe(stock);
    expect(mockDb.getOrders()).toHaveLength(count);
  });

  it.each([0, -1, 1.5, 11])('rejects quantity %s at the HTTP boundary without mutating stock', async (quantity) => {
    const before = mockDb.getProductById('prod-1')!.stock;
    await expect(client.post('/orders/checkout', { ...INPUT, items: [{ productId: 'prod-1', quantity }] })).rejects.toMatchObject({ status: 422 });
    expect(mockDb.getProductById('prod-1')!.stock).toBe(before);
  });

  it('rejects malformed bodies, duplicate products and invalid billing', async () => {
    for (const body of [null, { ...INPUT, items: [...INPUT.items, ...INPUT.items] }, { ...INPUT, billingInfo: { ...INPUT.billingInfo, email: 'invalid' } }, { ...INPUT, paymentMethod: 'CASH' }]) {
      await expect(client.post('/orders/checkout', body)).rejects.toMatchObject({ status: 422 });
    }
    expect(mockDb.getOrders()).toHaveLength(6);
  });

  it('allows only one concurrent purchase of the last unit', async () => {
    const stock = mockDb.getProductById('prod-1')!.stock;
    mockDb.decrementStock('prod-1', stock - 1);
    const results = await Promise.all([checkout.execute({ ...INPUT, items: [{ productId: 'prod-1', quantity: 1 }] }), checkout.execute({ ...INPUT, items: [{ productId: 'prod-1', quantity: 1 }] })]);
    expect(results.filter((result) => result.isSuccess)).toHaveLength(1);
    expect(results.find((result) => result.isFailure)!.error.code).toBe('CONFLICT');
    expect(mockDb.getProductById('prod-1')!.stock).toBe(0);
  });

  it('requires auth and prevents reading another account’s orders', async () => {
    const order = (await checkout.execute(INPUT)).value;
    await login.execute({ email: 'jane.smith@example.com', password: 'password123' });
    expect((await orders.execute()).value).toEqual({ items: [], total: 0, page: 1, limit: 8, totalPages: 1 });
    expect((await detail.execute(order.id)).error.code).toBe('NOT_FOUND');
    document.cookie = 'voca_access_token=; Path=/; Max-Age=0';
    const { CookieSessionStore } = await import('@/shared/infrastructure/storage/cookie-session-store');
    new CookieSessionStore().clear();
    expect((await orders.execute()).error.code).toBe('UNAUTHORIZED');
    expect((await detail.execute(order.id)).error.code).toBe('UNAUTHORIZED');
    expect((await checkout.execute(INPUT)).error.code).toBe('UNAUTHORIZED');
  });
});
