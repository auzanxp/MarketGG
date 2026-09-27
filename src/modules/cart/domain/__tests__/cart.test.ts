import { describe, it, expect } from 'vitest';
import { Cart } from '../aggregates/cart';
import { CartItem, type CartItemProps } from '../entities/cart-item';
import { Money } from '@/shared/domain/money';

function makeItem(overrides: Partial<CartItemProps> = {}): CartItem {
  return CartItem.create({
    productId: 'prod-10',
    sku: 'STEAM-WALLET-010',
    title: 'Steam Wallet $10',
    publisher: 'Steam',
    unitPrice: Money.create(10, 'USD'),
    quantity: 1,
    imageUrl: 'https://example.com/img.jpg',
    ...overrides,
  });
}

describe('Cart Aggregate Root (DDD)', () => {
  it('should start empty and have zero total amount', () => {
    const cart = Cart.empty();
    expect(cart.isEmpty).toBe(true);
    expect(cart.totalItemCount).toBe(0);
    expect(cart.items).toHaveLength(0);
    expect(cart.totalAmount.amount).toBe(0);
  });

  it('should add item and calculate total price correctly', () => {
    const cart = Cart.empty().addItem(makeItem({ quantity: 2 }));

    expect(cart.isEmpty).toBe(false);
    expect(cart.lineCount).toBe(1);
    expect(cart.totalItemCount).toBe(2);
    expect(cart.totalAmount.amount).toBe(20);
  });

  it('should merge quantities when adding existing product', () => {
    const cart = Cart.empty()
      .addItem(makeItem({ quantity: 1 }))
      .addItem(makeItem({ quantity: 3 }));

    expect(cart.totalItemCount).toBe(4);
    expect(cart.items).toHaveLength(1);
    expect(cart.totalAmount.amount).toBe(40);
  });

  it('should keep separate lines for different products', () => {
    const cart = Cart.empty()
      .addItem(makeItem({ quantity: 1 }))
      .addItem(
        makeItem({
          productId: 'prod-1',
          sku: 'MLBB-DIAMOND-086',
          title: 'MLBB 86 Diamonds',
          publisher: 'Mobile Legends',
          unitPrice: Money.create(1.25, 'USD'),
          quantity: 2,
        })
      );

    expect(cart.lineCount).toBe(2);
    expect(cart.totalItemCount).toBe(3);
    expect(cart.totalAmount.amount).toBe(12.5);
  });

  it('should remove item by product id', () => {
    const cart = Cart.empty().addItem(makeItem()).removeItem('prod-10');

    expect(cart.totalItemCount).toBe(0);
    expect(cart.items).toHaveLength(0);
  });

  it('should treat a quantity of zero as a removal', () => {
    const cart = Cart.empty().addItem(makeItem({ quantity: 3 })).updateItemQuantity('prod-10', 0);

    expect(cart.items).toHaveLength(0);
  });

  it('should ignore quantity updates for products not in the cart', () => {
    const cart = Cart.empty().addItem(makeItem());
    const unchanged = cart.updateItemQuantity('prod-does-not-exist', 5);

    expect(unchanged.totalItemCount).toBe(1);
  });

  it('should clamp a merged quantity to the product cap', () => {
    const cart = Cart.empty()
      .addItem(makeItem({ quantity: 6, maxQuantity: 10 }))
      .addItem(makeItem({ quantity: 6, maxQuantity: 10 }));

    expect(cart.totalItemCount).toBe(10);
    expect(cart.items[0].isAtMaxQuantity).toBe(true);
  });

  it('should derive a price breakdown that matches the pricing policy', () => {
    const cart = Cart.empty()
      .addItem(makeItem({ quantity: 1 }))
      .addItem(
        makeItem({
          productId: 'prod-1',
          sku: 'MLBB-DIAMOND-086',
          title: 'MLBB 86 Diamonds',
          publisher: 'Mobile Legends',
          unitPrice: Money.create(1.25, 'USD'),
          quantity: 2,
        })
      );

    const breakdown = cart.priceBreakdown;
    expect(breakdown.subtotal.amount).toBe(12.5);
    expect(breakdown.tax.amount).toBe(1.38);
    expect(breakdown.serviceFee.amount).toBe(0.5);
    expect(breakdown.total.amount).toBe(14.38);
  });

  it('should not charge a service fee on an empty cart', () => {
    const breakdown = Cart.empty().priceBreakdown;

    expect(breakdown.serviceFee.amount).toBe(0);
    expect(breakdown.total.amount).toBe(0);
  });

  it('rejects fractional quantities and invalid caps instead of creating broken cart lines', () => {
    expect(() => makeItem({ quantity: 1.5 })).toThrow();
    expect(() => makeItem({ quantity: Number.NaN })).toThrow();
    expect(() => makeItem({ maxQuantity: 0 })).toThrow();
  });
});
