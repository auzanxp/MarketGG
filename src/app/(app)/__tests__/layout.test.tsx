import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/test/render-with-providers';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { SESSION_QUERY_KEY } from '@/modules/identity/presentation/hooks/use-session';
import { useCartStore } from '@/modules/cart/presentation/stores/use-cart-store';
import { DashboardView } from '@/modules/dashboard/presentation/components/dashboard-view';
import AppLayout from '../layout';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/dashboard',
}));
vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

describe('AppLayout', () => {
  beforeEach(async () => {
    router.push.mockClear();
    router.replace.mockClear();
    await useCartStore.getState().setAccount(null);
    const login = createContainer().resolve<LoginUseCase>(TOKENS.LoginUseCase);
    expect((await login.execute({ email: 'john.doe@example.com', password: 'password123' })).isSuccess).toBe(true);
  });

  it.each([
    ['  call of duty & more  ', '/marketplace?q=call+of+duty+%26+more'],
    ['   ', '/marketplace'],
  ])('submits the global search (%s) and clears the draft', async (query, path) => {
    renderWithProviders(<AppLayout><p>Page content</p></AppLayout>);
    await screen.findByText('John Doe');
    const input = screen.getByRole('searchbox', { name: 'Search products, games, categories' });
    fireEvent.change(input, { target: { value: query } });
    fireEvent.submit(screen.getByRole('search', { name: 'Global product search' }));

    expect(router.push).toHaveBeenCalledWith(path);
    expect(input).toHaveValue('');
  });

  it('clears the session and redirects when a protected dashboard query returns 401', async () => {
    server.use(http.get('*/api/v1/dashboard/summary', () =>
      HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 })
    ));
    const { queryClient } = renderWithProviders(<AppLayout><DashboardView /></AppLayout>);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login?next=%2Fdashboard'));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    expect(useCartStore.getState().userId).toBeNull();
    expect(queryClient.getQueriesData({ queryKey: ['dashboard', 'summary'] })).toEqual([]);
  });

  it('stores dashboard data under the authenticated account', async () => {
    const { queryClient } = renderWithProviders(<AppLayout><DashboardView /></AppLayout>);
    await screen.findByText('Revenue Today');
    expect(queryClient.getQueryData(['dashboard', 'summary', 'usr-101'])).toBeDefined();
    expect(queryClient.getQueryData(['dashboard', 'summary', 'usr-102'])).toBeUndefined();
  });
});
