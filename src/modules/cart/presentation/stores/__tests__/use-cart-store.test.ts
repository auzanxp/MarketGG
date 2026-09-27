import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCartStore } from '../use-cart-store';
import { Product } from '@/modules/catalog/domain/entities/product';
import { Money } from '@/shared/domain/money';
import { toast } from 'sonner';

describe('useCartStore', () => {
  const dummyProduct = Product.create({
    id: 'prod-1',
    sku: 'MLBB-DIAMOND-086',
    title: 'MLBB 86 Diamonds',
    publisher: 'Mobile Legends',
    description: 'Top up 86 Diamonds in Mobile Legends: Bang Bang.',
    price: Money.create(1.25, 'USD'),
    stock: 125,
    category: 'Games',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
    rating: 4.9,
    soldCount: 48210,
  });

  const scarceProduct = Product.create({
    id: 'prod-16',
    sku: 'XBOX-GIFT-00025',
    title: 'Xbox Gift Card $25',
    publisher: 'Xbox',
    description: 'Use $25 on games, add-ons, and Game Pass.',
    price: Money.create(25, 'USD'),
    stock: 2,
    category: 'Gift Cards',
    imageUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d',
    rating: 4.7,
  });

  beforeEach(async () => {
    await useCartStore.getState().setAccount(null);
    window.localStorage.clear();
    useCartStore.getState().clearCart();
  });
  afterEach(async () => {
    await useCartStore.getState().setAccount(null);
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with an empty cart', () => {
    const state = useCartStore.getState();
    expect(state.cart.isEmpty).toBe(true);
    expect(state.cart.items.length).toBe(0);
    expect(state.cart.totalItemCount).toBe(0);
  });

  it('should add item and calculate total price', () => {
    useCartStore.getState().addItem(dummyProduct, 2);

    const state = useCartStore.getState();
    expect(state.cart.items.length).toBe(1);
    expect(state.cart.totalItemCount).toBe(2);
    expect(state.cart.totalAmount.amount).toBe(2.5);
  });

  it('should carry the publisher through to the cart line', () => {
    useCartStore.getState().addItem(dummyProduct);

    expect(useCartStore.getState().cart.items[0].publisher).toBe('Mobile Legends');
  });

  it('should update item quantity and remove when quantity is 0', () => {
    useCartStore.getState().addItem(dummyProduct, 2);
    useCartStore.getState().updateQuantity('prod-1', 5);

    expect(useCartStore.getState().cart.totalItemCount).toBe(5);

    useCartStore.getState().updateQuantity('prod-1', 0);
    expect(useCartStore.getState().cart.items.length).toBe(0);
  });

  it('should remove an item explicitly', () => {
    useCartStore.getState().addItem(dummyProduct, 2);
    useCartStore.getState().removeItem('prod-1');

    expect(useCartStore.getState().cart.isEmpty).toBe(true);
  });

  it('should never let a line exceed what the product allows', () => {
    useCartStore.getState().addItem(scarceProduct, 2);
    useCartStore.getState().addItem(scarceProduct, 2);

    expect(useCartStore.getState().cart.totalItemCount).toBe(2);
  });

  it('should expose a price breakdown for the basket', () => {
    useCartStore.getState().addItem(dummyProduct, 2);

    const breakdown = useCartStore.getState().cart.priceBreakdown;
    expect(breakdown.subtotal.amount).toBe(2.5);
    expect(breakdown.total.amount).toBe(3.28);
  });

  it('restores real domain objects after refreshing an account cart', async () => {
    await useCartStore.getState().setAccount('usr-101');
    useCartStore.getState().addItem(dummyProduct, 2);
    await useCartStore.getState().setAccount(null);
    await useCartStore.getState().setAccount('usr-101');
    const cart = useCartStore.getState().cart;
    expect(cart.items[0].unitPrice).toBeInstanceOf(Money);
    expect(cart.items[0].unitPrice.format()).toBe('$1.25');
    expect(cart.priceBreakdown.total.format()).toBe('$3.28');
    expect(cart.items[0].quantity).toBe(2);
    expect(useCartStore.getState().isHydrated).toBe(true);
  });

  it('opens a first-time account with an empty cart without a corruption warning', async () => {
    const warning = vi.spyOn(toast, 'warning');
    await useCartStore.getState().setAccount('usr-102');
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
    expect(useCartStore.getState().isHydrated).toBe(true);
    expect(warning).not.toHaveBeenCalled();
  });

  it('keeps accounts separate and retains a logged-out account’s saved cart', async () => {
    await useCartStore.getState().setAccount('usr-101');
    useCartStore.getState().addItem(dummyProduct, 2);
    await useCartStore.getState().setAccount('usr-102');
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
    useCartStore.getState().addItem(scarceProduct);
    await useCartStore.getState().setAccount('usr-101');
    expect(useCartStore.getState().cart.items[0].productId).toBe(dummyProduct.id);
    expect(useCartStore.getState().cart.totalItemCount).toBe(2);
  });

  it('persists an empty basket after a completed checkout clears it', async () => {
    await useCartStore.getState().setAccount('usr-101');
    useCartStore.getState().addItem(dummyProduct);
    useCartStore.getState().clearCart();
    await useCartStore.getState().setAccount(null);
    await useCartStore.getState().setAccount('usr-101');
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
  });

  it.each(['broken json', JSON.stringify({ version: 1, state: { items: [{ quantity: -1 }] } }), JSON.stringify({ version: 0, state: {} })])('recovers a corrupt or incompatible basket', async (raw) => {
    window.localStorage.setItem('vocamarket:cart:usr-101', raw);
    await expect(useCartStore.getState().setAccount('usr-101')).resolves.toBeUndefined();
    expect(useCartStore.getState().cart.isEmpty).toBe(true);
    expect(useCartStore.getState().isHydrated).toBe(true);
  });

  it('does not lose the active cart when storage writes fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await useCartStore.getState().setAccount('usr-101');
    expect(() => useCartStore.getState().addItem(dummyProduct, 2)).not.toThrow();
    expect(useCartStore.getState().cart.totalItemCount).toBe(2);
  });
});
