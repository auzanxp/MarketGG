import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/test/render-with-providers';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { DashboardView } from '../dashboard-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

async function signIn() {
  const container = createContainer();
  const login = container.resolve<LoginUseCase>(TOKENS.LoginUseCase);
  const result = await login.execute({
    email: 'john.doe@example.com',
    password: 'password123',
  });
  expect(result.isSuccess).toBe(true);
}

describe('DashboardView', () => {
  beforeEach(async () => {
    await signIn();
  });

  describe('greeting', () => {
    it('addresses the signed-in user by first name', async () => {
      renderWithProviders(<DashboardView />);

      const heading = await screen.findByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/John/);
      expect(heading).toHaveTextContent(/Good (Morning|Afternoon|Evening)/);
    });

    it('shows the store subtitle', async () => {
      renderWithProviders(<DashboardView />);

      expect(
        await screen.findByText(/what's happening with your store today/i)
      ).toBeInTheDocument();
    });
  });

  describe('stats', () => {
    it('renders the three headline metrics with formatted values', async () => {
      renderWithProviders(<DashboardView />);

      expect(await screen.findByText('1,245')).toBeInTheDocument();
      expect(screen.getByText('328')).toBeInTheDocument();
      expect(screen.getByText('$18,245.00')).toBeInTheDocument();

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Orders Today')).toBeInTheDocument();
      expect(screen.getByText('Revenue Today')).toBeInTheDocument();
    });

    it('shows each trend against yesterday', async () => {
      renderWithProviders(<DashboardView />);

      expect(await screen.findByText('+12%')).toBeInTheDocument();
      expect(screen.getByText('+8.2%')).toBeInTheDocument();
      expect(screen.getByText('+15.3%')).toBeInTheDocument();
      expect(screen.getAllByText('vs yesterday')).toHaveLength(3);
    });
  });

  describe('categories', () => {
    it('links each tile into the marketplace with the filter pre-applied', async () => {
      renderWithProviders(<DashboardView />);

      const gamesLink = await screen.findByRole('link', { name: /Games/ });
      expect(gamesLink).toHaveAttribute('href', '/marketplace?category=games');

      expect(screen.getByRole('link', { name: /Gift Cards/ })).toHaveAttribute(
        'href',
        '/marketplace?category=gift-cards'
      );
    });

    it('shows catalogue-wide counts', async () => {
      renderWithProviders(<DashboardView />);

      expect(await screen.findByText('1,245 items')).toBeInTheDocument();
      expect(screen.getByText('532 items')).toBeInTheDocument();
    });

    it('offers a "View all" escape to the full catalogue', async () => {
      renderWithProviders(<DashboardView />);

      expect(await screen.findByRole('link', { name: 'View all' })).toHaveAttribute(
        'href',
        '/marketplace'
      );
    });
  });

  describe('recent orders', () => {
    it('renders a real, named table', async () => {
      renderWithProviders(<DashboardView />);

      const table = await screen.findByRole('table', {
        name: /most recent orders/i,
      });

      expect(within(table).getByRole('columnheader', { name: 'Order ID' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Product' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
      expect(within(table).getByRole('columnheader', { name: 'Time' })).toBeInTheDocument();
    });

    it('shows the rows from the design', async () => {
      renderWithProviders(<DashboardView />);

      expect(await screen.findByText('INV-202600017')).toBeInTheDocument();
      expect(screen.getByText('MLBB 86 Diamonds')).toBeInTheDocument();
      expect(screen.getByText('INV-202600015')).toBeInTheDocument();
      expect(screen.getByText('PUBG UC 60')).toBeInTheDocument();
    });

    it('distinguishes completed from pending', async () => {
      renderWithProviders(<DashboardView />);

      await screen.findByText('INV-202600017');

      expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('pairs the human time with a machine-readable instant', async () => {
      renderWithProviders(<DashboardView />);

      const time = await screen.findByText('2 mins ago');
      expect(time.tagName).toBe('TIME');
      expect(time).toHaveAttribute('dateTime', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    });
  });

  describe('failure handling', () => {
    it('recovers a failed category query', async () => {
      server.use(http.get('*/api/v1/categories', () =>
        HttpResponse.json({ status: 503, title: 'Unavailable' }, { status: 503 })
      ));
      renderWithProviders(<DashboardView />);
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load categories');
      expect(await screen.findByText('Revenue Today')).toBeInTheDocument();
      server.resetHandlers();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByRole('link', { name: /Games/ })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('explains a failed summary and offers a retry, keeping categories visible', async () => {
      server.use(http.get('*/api/v1/dashboard/summary', () =>
        HttpResponse.json({ status: 503, title: 'Unavailable' }, { status: 503 })
      ));

      renderWithProviders(<DashboardView />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/could not load your dashboard/i);
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
      });

      expect(screen.queryByText('Revenue Today')).not.toBeInTheDocument();
    });
  });
});
