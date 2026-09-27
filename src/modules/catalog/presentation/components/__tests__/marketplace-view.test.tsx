import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { server } from '@/mocks/server';
import { mockDb } from '@/mocks/db/mock-db';
import { renderWithProviders } from '@/test/render-with-providers';
import { DEFAULT_PAGE_SIZE } from '../../../application/use-cases/get-products.usecase';
import { MarketplaceView } from '../marketplace-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/marketplace',
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function getGrid() {
  return screen.getByTestId('product-grid');
}

async function findCards() {
  await screen.findByTestId('product-grid');
  return within(getGrid()).getAllByRole('article');
}

describe('MarketplaceView', () => {
  describe('header and structure', () => {
    it('renders the page heading from the design', async () => {
      renderWithProviders(<MarketplaceView />);

      expect(screen.getByRole('heading', { level: 1, name: 'Marketplace' })).toBeInTheDocument();
      expect(
        screen.getByText('Find your favorite games and digital products.')
      ).toBeInTheDocument();
    });

    it('fills a page with the design grid size', async () => {
      renderWithProviders(<MarketplaceView />);

      const cards = await findCards();
      expect(cards).toHaveLength(DEFAULT_PAGE_SIZE);
    });
  });

  describe('product cards', () => {
    it('shows title, publisher, price, stock, and rating', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();

      const card = screen.getByRole('article', { name: 'MLBB 86 Diamonds' });
      expect(within(card).getByRole('link')).toHaveAttribute('href', '/products/MLBB-DIAMOND-086');
      expect(within(card).getByText('Mobile Legends')).toBeInTheDocument();
      expect(within(card).getByText('$1.25')).toBeInTheDocument();
      expect(within(card).getByText('Stock: 125')).toBeInTheDocument();
      expect(within(card).getByRole('img', { name: 'Rated 4.9 out of 5' })).toBeInTheDocument();
    });

    it('flags sold-out and nearly-gone stock', async () => {
      renderWithProviders(<MarketplaceView />, { searchParams: '?sort=price_desc' });

      await findCards();

      expect(screen.getByText('Sold out')).toBeInTheDocument();
      expect(screen.getByText('Only 2 left')).toBeInTheDocument();
    });
  });

  describe('URL as the source of truth', () => {
    it.each([[0, 1], [-1, 1], [99, 4]])('uses the API page for ?page=%s', async (requested, actual) => {
      renderWithProviders(<MarketplaceView />, { searchParams: `?page=${requested}` });
      await findCards();

      expect(screen.getByRole('button', { name: `Go to page ${actual}` })).toHaveAttribute('aria-current', 'page');
      if (actual === 1) expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
      if (actual === 4) expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
    });

    it('applies filters from the initial query string', async () => {
      renderWithProviders(<MarketplaceView />, { searchParams: '?category=entertainment' });

      const cards = await findCards();

      expect(cards.length).toBeGreaterThan(0);
      expect(screen.getByRole('article', { name: 'Netflix 1 Month Standard' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveTextContent('Entertainment');
      expect(screen.queryByRole('article', { name: 'MLBB 86 Diamonds' })).not.toBeInTheDocument();
    });

    it('honours sort from the URL', async () => {
      renderWithProviders(<MarketplaceView />, { searchParams: '?sort=price_asc' });

      const cards = await findCards();

      expect(cards[0]).toHaveAccessibleName(/PUBG UC 60|Free Fire 100 Diamonds|CoD|Call of Duty/);
    });

    it('honours page from the URL', async () => {
      renderWithProviders(<MarketplaceView />, { searchParams: '?page=2' });

      await findCards();

      expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    it('writes a filter change back to the URL', async () => {
      const onUrlUpdate = vi.fn();
      renderWithProviders(<MarketplaceView />, { onUrlUpdate });

      await findCards();
      fireEvent.change(screen.getByLabelText('Search products'), {
        target: { value: 'netflix' },
      });

      await waitFor(() => {
        expect(onUrlUpdate).toHaveBeenCalled();
      });
      const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0] as { queryString: string };
      expect(lastCall.queryString).toContain('q=netflix');
    });
  });

  describe('search', () => {
    it('keeps the previous grid and announces an in-flight search', async () => {
      renderWithProviders(<MarketplaceView />);
      await findCards();
      let release!: () => void;
      const pending = new Promise<void>((resolve) => { release = resolve; });
      server.use(http.get('*/api/v1/products', async () => {
        await pending;
        const result = mockDb.getProducts({ query: 'netflix' });
        return HttpResponse.json({ items: result.items, meta: {
          total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
        } });
      }));
      fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'netflix' } });

      expect(await screen.findByText('Updating products…')).toBeInTheDocument();
      expect(screen.getByRole('article', { name: 'MLBB 86 Diamonds' })).toBeInTheDocument();
      expect(getGrid()).toHaveAttribute('aria-busy', 'true');
      release();
      await waitFor(() => expect(within(getGrid()).getAllByRole('article')).toHaveLength(1));
      expect(screen.queryByText('Updating products…')).not.toBeInTheDocument();
    });

    it('narrows the grid after the debounce', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();
      fireEvent.change(screen.getByLabelText('Search products'), {
        target: { value: 'netflix' },
      });

      await waitFor(
        () => {
          expect(
            screen.getByRole('article', { name: 'Netflix 1 Month Standard' })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      expect(within(getGrid()).getAllByRole('article')).toHaveLength(1);
    });
  });

  describe('empty state', () => {
    it('explains the empty result and offers a way out', async () => {
      renderWithProviders(<MarketplaceView />, { searchParams: '?q=zzzznotathing' });

      expect(await screen.findByText(/no products match your filters/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      expect(screen.queryByTestId('product-grid')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it.each(['categories', 'publishers'])('recovers a failed %s filter without hiding products', async (endpoint) => {
      server.use(http.get(`*/api/v1/${endpoint}`, () =>
        HttpResponse.json({ title: 'Unavailable', status: 503 }, { status: 503 })
      ));
      renderWithProviders(<MarketplaceView />);
      await findCards();
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load product filters');

      server.resetHandlers();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      expect(getGrid()).toBeInTheDocument();
    });

    it('reports a server failure and offers a retry instead of a blank page', async () => {
      server.use(
        http.get('*/api/v1/products', () =>
          HttpResponse.json(
            { title: 'Internal Server Error', status: 500, detail: 'boom' },
            { status: 500 }
          )
        )
      );

      renderWithProviders(<MarketplaceView />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/could not load products/i);
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.queryByTestId('product-grid')).not.toBeInTheDocument();
    });
  });

  describe('layout toggle', () => {
    it('moves keyboard focus with the selected layout', async () => {
      renderWithProviders(<MarketplaceView />);
      await findCards();
      const grid = screen.getByRole('radio', { name: 'Grid view' });
      const list = screen.getByRole('radio', { name: 'List view' });
      grid.focus();
      fireEvent.keyDown(grid, { key: 'ArrowRight' });
      expect(list).toHaveFocus();
      expect(list).toBeChecked();
      fireEvent.keyDown(list, { key: 'Home' });
      expect(grid).toHaveFocus();
      expect(grid).toBeChecked();
    });

    it('is a radio group, because the options are mutually exclusive', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();

      const group = screen.getByRole('radiogroup', { name: 'Product layout' });
      expect(within(group).getByRole('radio', { name: 'Grid view' })).toBeChecked();
      expect(within(group).getByRole('radio', { name: 'List view' })).not.toBeChecked();
    });

    it('switches layout on selection', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();
      fireEvent.click(screen.getByRole('radio', { name: 'List view' }));

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: 'List view' })).toBeChecked();
      });
    });
  });

  describe('pagination', () => {
    it('exposes a named navigation landmark with accessible controls', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();

      const nav = screen.getByRole('navigation', { name: 'Pagination' });
      expect(within(nav).getByRole('button', { name: 'Go to page 1' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(within(nav).getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
      expect(within(nav).getByRole('button', { name: 'Go to next page' })).toBeEnabled();
    });

    it('moves to the requested page', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();
      fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
          'aria-current',
          'page'
        );
      });
    });
  });

  describe('filter controls', () => {
    it('gives every filter an accessible name, despite showing none visually', async () => {
      renderWithProviders(<MarketplaceView />);

      await findCards();

      expect(screen.getByRole('combobox', { name: 'Filter by category' })).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: 'Filter by game or brand' })
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Sort products' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveTextContent('All Categories');
      expect(screen.getByRole('combobox', { name: 'Filter by game or brand' })).toHaveTextContent('All Games');
      expect(screen.getByRole('combobox', { name: 'Sort products' })).toHaveTextContent('Popular');
    });
  });
});
