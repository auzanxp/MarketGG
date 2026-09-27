import { type ReactNode } from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render-with-providers';
import { server } from '@/mocks/server';
import { mockDb } from '@/mocks/db/mock-db';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { useCartSession } from '@/modules/cart/presentation/hooks/use-cart-session';
import { useCartStore } from '@/modules/cart/presentation/stores/use-cart-store';
import { Product } from '@/modules/catalog/domain/entities/product';
import { ProductDetailView } from '@/modules/catalog/presentation/components/product-detail-view';
import { CartView } from '@/modules/cart/presentation/components/cart-view';
import CheckoutSuccessPage from '@/app/(app)/checkout/success/page';
import { CheckoutView } from '../checkout-view';
import { OrderSuccessView } from '../order-success-view';
import { OrderHistoryView } from '../order-history-view';

const { replace, push, successToast } = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), successToast: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push }), usePathname: () => '/checkout' }));
vi.mock('sonner', () => ({ toast: { success: successToast, info: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

function Session({ children }: { children: ReactNode }) {
  useCartSession();
  return children;
}

async function signIn(email = 'john.doe@example.com') {
  const login = createContainer().resolve<LoginUseCase>(TOKENS.LoginUseCase);
  expect((await login.execute({ email, password: 'password123' })).isSuccess).toBe(true);
}

async function prepareCart() {
  await useCartStore.getState().setAccount('usr-101');
  useCartStore.getState().addItem(Product.fromJSON(mockDb.getProductById('prod-1')!), 2);
}

function fillPhone() {
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+12345678900' } });
}

beforeEach(async () => {
  await useCartStore.getState().setAccount(null);
  window.localStorage.clear();
  vi.clearAllMocks();
  await signIn();
});
afterEach(async () => {
  await useCartStore.getState().setAccount(null);
  window.localStorage.clear();
});

describe('Purchase flow', () => {
  it('integrates product detail, cart, checkout, refreshed success and history receipt', async () => {
    mockDb.enablePersistence(window.localStorage);
    await signIn();
    const view = renderWithProviders(<Session><ProductDetailView sku="MLBB-DIAMOND-086" /></Session>);
    view.queryClient.setQueryDefaults(['orders'], { gcTime: Infinity });
    view.queryClient.setQueryDefaults(['dashboard'], { gcTime: Infinity });
    view.queryClient.setQueryData(['orders', 'usr-101', 'list', {}], { items: [], total: 0, page: 1, limit: 8, totalPages: 1 });
    view.queryClient.setQueryData(['dashboard', 'summary'], { recentOrders: [] });
    const add = await screen.findByRole('button', { name: 'Add to Cart' });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    fireEvent.click(screen.getByRole('button', { name: 'Buy Now' }));
    expect(push).toHaveBeenCalledWith('/checkout');
    expect(useCartStore.getState().cart.totalItemCount).toBe(2);

    view.rerender(<Session><CartView /></Session>);
    expect(await screen.findByRole('spinbutton', { name: /Quantity for MLBB/ })).toHaveValue(2);
    expect(screen.getByRole('link', { name: 'MLBB 86 Diamonds' })).toHaveAttribute('href', '/products/MLBB-DIAMOND-086');
    expect(useCartStore.getState().cart.items[0].productId).toBe('prod-1');
    expect(screen.getByText('$3.28')).toBeInTheDocument();
    view.rerender(<Session><CheckoutView /></Session>);
    await screen.findByLabelText('Phone Number');
    expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
    fillPhone();
    fireEvent.click(screen.getByRole('radio', { name: /E-Wallet/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Complete Purchase' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith(expect.stringContaining('/checkout/success?order=')));
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
    expect(view.queryClient.getQueryState(['orders', 'usr-101', 'list', {}])?.isInvalidated).toBe(true);
    expect(view.queryClient.getQueryState(['dashboard', 'summary'])?.isInvalidated).toBe(true);
    const order = mockDb.getOrders()[0];
    expect(order.paymentMethod).toBe('EWALLET');
    expect(order.totalAmount.amount).toBe(3.28);
    view.unmount();

    mockDb.reset();
    expect(mockDb.enablePersistence(window.localStorage)).toBeNull();
    await useCartStore.getState().setAccount(null);
    const refreshed = renderWithProviders(<Session><OrderSuccessView orderId={order.id} /></Session>);
    expect(await screen.findByRole('heading', { name: 'Payment Successful!' })).toBeInTheDocument();
    expect(screen.getByText(order.orderNumber)).toBeInTheDocument();
    refreshed.rerender(<Session><OrderHistoryView /></Session>);
    const button = await screen.findByRole('button', { name: 'View order ' + order.orderNumber });
    fireEvent.click(button);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('$3.28')).toBeInTheDocument();
    expect(within(dialog).getByText('Tax')).toBeInTheDocument();
  });

  it('prevents duplicate submission while a purchase is pending', async () => {
    await prepareCart();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const request = vi.fn();
    server.use(http.post('*/api/v1/orders/checkout', async () => {
      request();
      await pending;
      return HttpResponse.json({ message: 'ok', order: mockDb.createOrder({ userId: 'usr-101', items: [{ productId: 'prod-1', quantity: 2 }], billingInfo: { fullName: 'John Doe', email: 'john.doe@example.com', phone: '+12345678900' }, paymentMethod: 'CARD' }) }, { status: 201 });
    }));
    renderWithProviders(<Session><CheckoutView /></Session>);
    await screen.findByLabelText('Phone Number');
    fillPhone();
    const form = screen.getByRole('button', { name: 'Complete Purchase' }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Processing…' })).toBeDisabled();
    release();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each([422, 409, 503, 'network'] as const)('keeps cart and form on %s and allows manual retry', async (failure) => {
    await prepareCart();
    const request = vi.fn();
    server.use(http.post('*/api/v1/orders/checkout', () => {
      request();
      if (failure === 'network') return HttpResponse.error();
      return HttpResponse.json({ status: failure, title: 'Failed', detail: 'Please try again.', errors: failure === 422 ? { fullName: 'Check your billing name.' } : undefined, meta: failure === 409 ? { availableStock: 1 } : undefined }, { status: failure });
    }));
    renderWithProviders(<Session><CheckoutView /></Session>);
    await screen.findByLabelText('Phone Number');
    fillPhone();
    fireEvent.click(screen.getByRole('button', { name: 'Complete Purchase' }));
    expect(await screen.findByText(failure === 409 ? 'Please review your cart' : 'Could not complete your purchase')).toBeInTheDocument();
    expect(useCartStore.getState().cart.totalItemCount).toBe(2);
    expect(screen.getByLabelText('Phone Number')).toHaveValue('+12345678900');
    expect(replace).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
    if (failure === 409) expect(screen.getByRole('link', { name: 'Review cart' })).toHaveAttribute('href', '/cart');
    if (failure === 422) expect(await screen.findByText('Check your billing name.')).toBeInTheDocument();
    server.resetHandlers();
    fireEvent.click(screen.getByRole('button', { name: 'Complete Purchase' }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });

  it.each(['PENDING', 'FAILED'] as const)('handles a %s checkout response honestly', async (status) => {
    await prepareCart();
    const order = mockDb.getOrders({ status })[0];
    server.use(http.post('*/api/v1/orders/checkout', () => HttpResponse.json({ message: 'ok', order }, { status: 201 })));
    const view = renderWithProviders(<Session><CheckoutView /></Session>);
    await screen.findByLabelText('Phone Number');
    fillPhone();
    fireEvent.click(screen.getByRole('button', { name: 'Complete Purchase' }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(useCartStore.getState().cart.isEmpty).toBe(status !== 'FAILED');
    view.rerender(<Session><OrderSuccessView orderId={order.id} /></Session>);
    expect(await screen.findByRole('heading', { name: status === 'PENDING' ? 'Order received' : 'Payment did not go through' })).toBeInTheDocument();
    expect(screen.queryByText('Payment Successful!')).not.toBeInTheDocument();
  });

  it('does not clear a new account’s cart when an old session’s checkout completes', async () => {
    await prepareCart();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const order = mockDb.getOrders()[0];
    const request = vi.fn();
    server.use(http.post('*/api/v1/orders/checkout', async () => { request(); await pending; return HttpResponse.json({ message: 'ok', order }); }));
    const view = renderWithProviders(<Session><CheckoutView /></Session>);
    await screen.findByLabelText('Phone Number');
    fillPhone();
    fireEvent.click(screen.getByRole('button', { name: 'Complete Purchase' }));
    await waitFor(() => expect(request).toHaveBeenCalled());
    await act(async () => {
      await useCartStore.getState().setAccount('usr-102');
      useCartStore.getState().addItem(Product.fromJSON(mockDb.getProductById('prod-10')!));
    });
    release();
    await waitFor(() => expect(view.queryClient.isMutating()).toBe(0));
    expect(useCartStore.getState().cart.items[0].productId).toBe('prod-10');
    expect(replace).not.toHaveBeenCalled();
  });

  it('makes removal undoable without leaking the undo into another account', async () => {
    await prepareCart();
    renderWithProviders(<Session><CartView /></Session>);
    fireEvent.click(await screen.findByRole('button', { name: /Remove MLBB/ }));
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
    const undo = successToast.mock.calls[0][1].action.onClick;
    act(() => undo());
    expect(useCartStore.getState().cart.totalItemCount).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: /Remove MLBB/ }));
    await act(async () => { await useCartStore.getState().setAccount('usr-102'); undo(); });
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
  });
});

describe('Success and history', () => {
  it('restores the URL page, navigates pages, and resets pagination when status changes', async () => {
    for (let index = 0; index < 3; index++) {
      mockDb.createOrder({ userId: 'usr-101', items: [{ productId: 'prod-1', quantity: 1 }], billingInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '+12345678900' }, paymentMethod: 'CARD' });
    }
    const update = vi.fn();
    renderWithProviders(<Session><OrderHistoryView /></Session>, { searchParams: '?page=2', onUrlUpdate: update });
    await screen.findByRole('button', { name: 'View order INV-202600012' });
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
    await screen.findByRole('button', { name: 'View order INV-202600017' });
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    await screen.findByRole('button', { name: 'View order INV-202600012' });
    fireEvent.click(screen.getByRole('radio', { name: 'Failed' }));
    await screen.findByRole('button', { name: 'View order INV-202600013' });
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    expect(update.mock.calls.at(-1)?.[0].queryString).not.toContain('page=2');
  });

  it('uses the API-clamped page and resets it when searching or clearing filters', async () => {
    for (let index = 0; index < 3; index++) {
      mockDb.createOrder({ userId: 'usr-101', items: [{ productId: 'prod-1', quantity: 1 }], billingInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '+12345678900' }, paymentMethod: 'CARD' });
    }
    const update = vi.fn();
    renderWithProviders(<Session><OrderHistoryView /></Session>, { searchParams: '?page=99', onUrlUpdate: update });
    await screen.findByRole('button', { name: 'View order INV-202600012' });
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute('aria-current', 'page');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search order ID or product' }), { target: { value: 'zzzznotathing' } });
    await screen.findByText('No orders match your filters');
    expect(update.mock.calls.at(-1)?.[0].queryString).not.toContain('page=99');
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await screen.findByRole('button', { name: 'View order INV-202600017' });
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toHaveAttribute('aria-current', 'page');
  });

  it.each(['', 'missing'])('shows an empty state for order id "%s"', async (orderId) => {
    renderWithProviders(<Session><OrderSuccessView orderId={orderId} /></Session>);
    expect(await screen.findByText('Order not found')).toBeInTheDocument();
    expect(screen.queryByText('Payment Successful!')).not.toBeInTheDocument();
  });

  it('ignores a forged status query parameter', async () => {
    const page = await CheckoutSuccessPage({ searchParams: Promise.resolve({ order: 'ord-202600015', status: 'COMPLETED' }) });
    renderWithProviders(<Session>{page}</Session>);
    expect(await screen.findByRole('heading', { name: 'Order received' })).toBeInTheDocument();
  });

  it('filters on the server, writes search to the URL, and displays a receipt', async () => {
    const update = vi.fn();
    renderWithProviders(<Session><OrderHistoryView /></Session>, { searchParams: '?status=FAILED&q=iTunes', onUrlUpdate: update });
    const table = await screen.findByRole('table', { name: 'Your order history' });
    const view = await within(table).findByRole('button', { name: 'View order INV-202600013' });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    fireEvent.click(view);
    expect(await screen.findByRole('dialog')).toHaveTextContent('iTunes Gift Card $10');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('radio', { name: 'All' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'All' })).toBeChecked());
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search order ID or product' }), { target: { value: 'Steam' } });
    await waitFor(() => expect(update).toHaveBeenCalled());
    await screen.findByRole('button', { name: 'View order INV-202600016' });
    expect(within(table).queryByText('INV-202600013')).not.toBeInTheDocument();
  });

  it('shows a real empty history for Jane', async () => {
    await signIn('jane.smith@example.com');
    renderWithProviders(<Session><OrderHistoryView /></Session>);
    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(screen.queryByText('INV-202600017')).not.toBeInTheDocument();
  });

  it('offers retry on a failed history request without claiming there are no orders', async () => {
    server.use(http.get('*/api/v1/orders', () => HttpResponse.json({ status: 503 }, { status: 503 })));
    renderWithProviders(<Session><OrderHistoryView /></Session>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your orders');
    expect(screen.queryByText('No orders yet')).not.toBeInTheDocument();
    server.resetHandlers();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'View order INV-202600017' })).toBeInTheDocument();
  });
});
