import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import type * as Navigation from 'next/navigation';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockDb } from '@/mocks/db/mock-db';
import { renderWithProviders } from '@/test/render-with-providers';
import ProductDetailPage from '../page';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof Navigation>()),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/shared/infrastructure/query/get-query-client', () => ({
  getQueryClient: () => new QueryClient(),
}));

afterEach(() => vi.unstubAllEnvs());

describe('SKU product page', () => {
  it('renders the server snapshot as a domain product before the browser request completes', async () => {
    const page = await ProductDetailPage({ params: Promise.resolve({ sku: 'MLBB-DIAMOND-086' }) });
    const request = vi.fn();
    server.use(http.get('*/api/v1/products/sku/MLBB-DIAMOND-086', () => {
      request();
      return HttpResponse.json(mockDb.getProductBySku('MLBB-DIAMOND-086'));
    }));
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MSW', 'false');
    renderWithProviders(page, {
      queryClient: new QueryClient({ defaultOptions: { queries: { staleTime: 120_000, retry: false } } }),
    });
    expect(screen.getByRole('heading', { name: 'MLBB 86 Diamonds' })).toBeInTheDocument();
    expect(screen.getByText('$1.25')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it.each(['prod-1', 'missing-sku'])('rejects %s with the Next.js not-found boundary', async (sku) => {
    await expect(ProductDetailPage({ params: Promise.resolve({ sku }) }))
      .rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });

  it('keeps transient failures retryable without turning them into 404s', async () => {
    server.use(http.get('*/api/v1/products/sku/MLBB-DIAMOND-086', () =>
      HttpResponse.json({ status: 503 }, { status: 503 })
    ));
    const page = await ProductDetailPage({ params: Promise.resolve({ sku: 'MLBB-DIAMOND-086' }) });
    renderWithProviders(page);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this product');
    server.resetHandlers();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'MLBB 86 Diamonds' })).toBeInTheDocument();
  });
});
