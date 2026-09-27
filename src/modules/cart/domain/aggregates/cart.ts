import { type CartItem } from '../entities/cart-item';
import { Money } from '@/shared/domain/money';
import { PriceBreakdown } from '@/shared/domain/price-breakdown';

export class Cart {
  private constructor(private readonly _items: ReadonlyMap<string, CartItem> = new Map()) {}

  public static empty(): Cart {
    return new Cart(new Map());
  }

  public static fromItems(items: readonly CartItem[]): Cart {
    return items.reduce<Cart>((cart, item) => cart.addItem(item), Cart.empty());
  }

  public get items(): CartItem[] {
    return Array.from(this._items.values());
  }

  public get isEmpty(): boolean {
    return this._items.size === 0;
  }

  public get lineCount(): number {
    return this._items.size;
  }

  public get totalItemCount(): number {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  public get totalAmount(): Money {
    if (this.items.length === 0) {
      return Money.zero();
    }
    return this.items.reduce(
      (acc, item) => acc.add(item.totalPrice),
      Money.zero(this.items[0].unitPrice.currency)
    );
  }

  public get priceBreakdown(): PriceBreakdown {
    return PriceBreakdown.fromSubtotal(this.totalAmount);
  }

  public addItem(item: CartItem): Cart {
    const nextMap = new Map(this._items);
    const existing = nextMap.get(item.productId);

    if (existing) {
      nextMap.set(item.productId, existing.withQuantity(existing.quantity + item.quantity));
    } else {
      nextMap.set(item.productId, item);
    }

    return new Cart(nextMap);
  }

  public removeItem(productId: string): Cart {
    const nextMap = new Map(this._items);
    nextMap.delete(productId);
    return new Cart(nextMap);
  }

  public updateItemQuantity(productId: string, quantity: number): Cart {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }

    const existing = this._items.get(productId);
    if (!existing) {
      return this;
    }

    const nextMap = new Map(this._items);
    nextMap.set(productId, existing.withQuantity(quantity));
    return new Cart(nextMap);
  }

  public clear(): Cart {
    return Cart.empty();
  }
}
