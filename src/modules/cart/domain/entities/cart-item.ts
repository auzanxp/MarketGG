import { type Money } from '@/shared/domain/money';

// Stored product data is a preview; checkout validates current prices and stock.
export interface CartItemProps {
  productId: string;
  sku: string;
  title: string;
  publisher: string;
  unitPrice: Money;
  quantity: number;
  imageUrl: string;
  maxQuantity?: number;
}

export class CartItem {
  private constructor(private readonly props: CartItemProps) {}

  public static create(props: CartItemProps): CartItem {
    if (!Number.isSafeInteger(props.quantity) || props.quantity <= 0) {
      throw new Error('CartItem quantity must be greater than zero');
    }

    const cap = props.maxQuantity ?? Number.MAX_SAFE_INTEGER;
    if (!Number.isSafeInteger(cap) || cap < 1) throw new Error('CartItem requires a positive quantity limit');
    return new CartItem({ ...props, quantity: Math.min(props.quantity, cap) });
  }

  public get productId(): string {
    return this.props.productId;
  }

  public get sku(): string {
    return this.props.sku;
  }

  public get title(): string {
    return this.props.title;
  }

  public get publisher(): string {
    return this.props.publisher;
  }

  public get unitPrice(): Money {
    return this.props.unitPrice;
  }

  public get quantity(): number {
    return this.props.quantity;
  }

  public get imageUrl(): string {
    return this.props.imageUrl;
  }

  public get maxQuantity(): number {
    return this.props.maxQuantity ?? Number.MAX_SAFE_INTEGER;
  }

  public get isAtMaxQuantity(): boolean {
    return this.props.quantity >= this.maxQuantity;
  }

  public get totalPrice(): Money {
    return this.unitPrice.multiply(this.quantity);
  }

  public withQuantity(newQuantity: number): CartItem {
    return CartItem.create({ ...this.props, quantity: newQuantity });
  }
}
