import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDb } from '@/mocks/db/mock-db';
import { LocalMockProductRepository } from '@/modules/catalog/infrastructure/repositories/local-mock-product.repository';
import { LocalMockDashboardRepository } from '@/modules/dashboard/infrastructure/repositories/local-mock-dashboard.repository';
import { FetchHttpClient } from '../fetch-http-client';
import { logApiResponse } from '../api-debug';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('API debug logging', () => {
  const entry = { source: 'http', method: 'GET', endpoint: '/products', status: 200, durationMs: 1, data: { items: [] } } as const;

  it('defaults to development only and accepts an explicit override', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_API_DEBUG', undefined);
    for (const environment of ['test', 'production', 'development']) {
      vi.stubEnv('NODE_ENV', environment);
      logApiResponse(entry);
    }
    expect(log).toHaveBeenCalledTimes(1);
    vi.stubEnv('NEXT_PUBLIC_API_DEBUG', 'false');
    logApiResponse(entry);
    expect(log).toHaveBeenCalledTimes(1);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_DEBUG', 'true');
    logApiResponse(entry);
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('logs browser responses and errors once without mutating sensitive data', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_DEBUG', 'true');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new FetchHttpClient();
    const response = await client.post('/auth/login', { email: 'john.doe@example.com', password: 'password123' });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toBe('[API][client][http]');
    expect(log.mock.calls[0][1]).toMatchObject({
      method: 'POST', status: 200,
      data: { user: { email: '[REDACTED]' }, tokens: { accessToken: '[REDACTED]', refreshToken: '[REDACTED]' } },
    });
    expect(response.data).toMatchObject({ user: { email: 'john.doe@example.com' } });
    await expect(client.get('/products?__chaos=503')).rejects.toMatchObject({ status: 503 });
    expect(log).toHaveBeenCalledTimes(2);
    expect(log.mock.calls[1][1]).toMatchObject({ status: 503, data: { status: 503 } });
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Offline'));
    await expect(client.get('/products')).rejects.toMatchObject({ status: 0 });
    expect(log.mock.calls[2][1]).toMatchObject({ status: 0 });
  });

  it('redacts nested billing and credentials without changing the input', () => {
    vi.stubEnv('NEXT_PUBLIC_API_DEBUG', 'true');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = { orders: [{ billingInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '123' } }], password: 'secret', Authorization: 'Bearer secret', cookie: 'session=secret' };
    const original = structuredClone(data);
    logApiResponse({ ...entry, data });
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
    expect(JSON.stringify(log.mock.calls)).not.toContain('John Doe');
    expect(data).toEqual(original);
  });

  it('logs server HTTP calls and local mock reads with their actual sources', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_DEBUG', 'true');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('window', undefined);
    try {
      await new FetchHttpClient().get('/products');
      const local = new LocalMockProductRepository();
      await local.getProducts();
      await local.getProductById('prod-1');
      await local.getProductById('missing');
      await local.getCategories();
      await local.getPublishers();
      await new LocalMockDashboardRepository().getSummary();
      const calls = log.mock.calls;
      expect(calls).toHaveLength(7);
      expect(calls[0][0]).toBe('[API][server][http]');
      expect(calls.slice(1).every(([prefix]) => prefix === '[API][server][local-mock]')).toBe(true);
      expect(JSON.parse(calls[1][1]).data.items[0]).toMatchObject({ title: 'MLBB 86 Diamonds', price: { amount: 1.25 } });
      expect(calls[1][1]).not.toContain('[Object]');
      expect(JSON.parse(calls[3][1])).toMatchObject({ status: 404, data: { status: 404 } });
    } finally { vi.unstubAllGlobals(); }
  });

  it('validates SSR responses with the same schemas as HTTP repositories', async () => {
    vi.spyOn(mockDb, 'getPublishers').mockReturnValue(['valid', 123] as unknown as string[]);
    const result = await new LocalMockProductRepository().getPublishers();
    expect(result.error.code).toBe('CONTRACT_MISMATCH');
    const page = mockDb.getProducts();
    vi.spyOn(mockDb, 'getProducts').mockReturnValue({ ...page, limit: 1.5 });
    expect((await new LocalMockProductRepository().getProducts()).error.code).toBe('CONTRACT_MISMATCH');
    const summary = mockDb.getDashboardSummary();
    vi.spyOn(mockDb, 'getDashboardSummary').mockReturnValue({ ...summary, stats: { ...summary.stats, products: { value: -1, deltaPercent: 0 } } });
    expect((await new LocalMockDashboardRepository().getSummary()).error.code).toBe('CONTRACT_MISMATCH');
  });
});
