import { describe, expect, it } from 'vitest';
import { Money } from '@/shared/domain/money';
import { Product } from '../entities/product';

// Exercise the same JSON round trip used by the dehydrated RSC query cache.

function makeProduct(overrides: Partial<Parameters<typeof Product.create>[0]> = {}) {
  return Product.create({
    id: 'prod-1',
    sku: 'MLBB-DIAMOND-086',
    title: 'MLBB 86 Diamonds',
    publisher: 'Mobile Legends',
    description: 'Top up 86 Diamonds in Mobile Legends: Bang Bang.',
    category: 'Games',
    price: Money.create(1.25, 'USD'),
    stock: 125,
    imageUrl: 'https://example.test/mlbb.jpg',
    rating: 4.9,
    soldCount: 48210,
    ...overrides,
  });
}

function throughTheWire<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value));
}

describe('Money serialisation', () => {
  it('survives the wire as a flat object', () => {
    const wire = throughTheWire(Money.create(1.25, 'USD'));

    expect(wire).toEqual({ amount: 1.25, currency: 'USD' });
  });

  it('round-trips to an equal value object', () => {
    const original = Money.create(18245, 'USD');

    const restored = Money.fromJSON(throughTheWire(original) as { amount: number; currency: string });

    expect(restored.equals(original)).toBe(true);
    expect(restored.format()).toBe(original.format());
  });

  it('passes an existing instance straight through', () => {
    const original = Money.create(5, 'USD');

    expect(Money.fromJSON(original)).toBe(original);
  });
});

describe('Product serialisation', () => {
  it('serialises to a flat snapshot with no private internals', () => {
    const wire = throughTheWire(makeProduct()) as Record<string, unknown>;

    expect(wire.id).toBe('prod-1');
    expect(wire.title).toBe('MLBB 86 Diamonds');
    expect(wire.publisher).toBe('Mobile Legends');
    expect(wire.price).toEqual({ amount: 1.25, currency: 'USD' });

    expect(wire).not.toHaveProperty('props');
    expect(wire).not.toHaveProperty('_id');
  });

  it('round-trips into a fully functional entity', () => {
    const original = makeProduct();

    const restored = Product.fromJSON(
      throughTheWire(original) as Parameters<typeof Product.fromJSON>[0]
    );

    expect(restored.id).toBe(original.id);
    expect(restored.sku).toBe(original.sku);
    expect(restored.title).toBe(original.title);
    expect(restored.publisher).toBe(original.publisher);
    expect(restored.description).toBe(original.description);
    expect(restored.category).toBe(original.category);
    expect(restored.stock).toBe(original.stock);
    expect(restored.imageUrl).toBe(original.imageUrl);
    expect(restored.rating).toBe(original.rating);
    expect(restored.soldCount).toBe(original.soldCount);

    expect(restored.price.format()).toBe('$1.25');
    expect(restored.isAvailable(1)).toBe(true);
    expect(restored.isLowStock).toBe(false);
    expect(restored.isOutOfStock).toBe(false);
  });

  it('preserves derived stock state across the wire', () => {
    const soldOut = Product.fromJSON(
      throughTheWire(makeProduct({ stock: 0 })) as Parameters<typeof Product.fromJSON>[0]
    );
    const nearlyGone = Product.fromJSON(
      throughTheWire(makeProduct({ stock: 2 })) as Parameters<typeof Product.fromJSON>[0]
    );

    expect(soldOut.isOutOfStock).toBe(true);
    expect(nearlyGone.isLowStock).toBe(true);
  });

  it('keeps optional fields optional', () => {
    const minimal = makeProduct({ rating: undefined, soldCount: undefined });

    const restored = Product.fromJSON(
      throughTheWire(minimal) as Parameters<typeof Product.fromJSON>[0]
    );

    expect(restored.rating).toBeUndefined();
    expect(restored.soldCount).toBe(0);
  });

  it('passes an existing instance straight through', () => {
    // select also receives existing entities before hydration; fromJSON must be idempotent.
    const original = makeProduct();

    expect(Product.fromJSON(original)).toBe(original);
  });

  it('survives a full paginated payload, the way the marketplace sends it', () => {
    const payload = {
      items: [makeProduct(), makeProduct({ id: 'prod-2', title: 'PUBG UC 60' })],
      total: 28,
      page: 1,
      totalPages: 4,
    };

    const wire = throughTheWire(payload) as { items: Parameters<typeof Product.fromJSON>[0][] };
    const restored = wire.items.map((item) => Product.fromJSON(item));

    expect(restored).toHaveLength(2);
    expect(restored.map((product) => product.title)).toEqual([
      'MLBB 86 Diamonds',
      'PUBG UC 60',
    ]);
    expect(restored.every((product) => product.price.format().startsWith('$'))).toBe(true);
  });
});
