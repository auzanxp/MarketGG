import { BaseEntity } from '@/shared/domain/base-entity';
import { Money, type MoneySnapshot } from '@/shared/domain/money';

const LOW_STOCK_THRESHOLD = 10;

// Mock checkout and quantity controls share this per-order limit.
export const MAX_ORDER_QUANTITY = 10;

export interface ProductSnapshot {
  id: string;
  sku: string;
  title: string;
  publisher: string;
  description: string;
  category: string;
  price: MoneySnapshot;
  stock: number;
  imageUrl: string;
  rating?: number;
  soldCount?: number;
}

export interface ProductProps {
  id: string;
  sku: string;
  title: string;
  publisher: string;
  description: string;
  category: string;
  price: Money;
  stock: number;
  imageUrl: string;
  rating?: number;
  soldCount?: number;
}

export class Product extends BaseEntity<string> {
  private readonly props: ProductProps;

  private constructor(props: ProductProps) {
    super(props.id);
    this.props = props;
  }

  public static create(props: ProductProps): Product {
    if (!Number.isSafeInteger(props.stock) || props.stock < 0) {
      throw new Error(`Product stock must be a nonnegative integer: ${props.stock}`);
    }
    if (!Number.isFinite(props.price.amount) || props.price.amount < 0) {
      throw new Error('Product price must be a nonnegative finite amount');
    }
    return new Product(props);
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

  public get description(): string {
    return this.props.description;
  }

  public get category(): string {
    return this.props.category;
  }

  public get price(): Money {
    return this.props.price;
  }

  public get stock(): number {
    return this.props.stock;
  }

  public get imageUrl(): string {
    return this.props.imageUrl;
  }

  public get rating(): number | undefined {
    return this.props.rating;
  }

  public get soldCount(): number {
    return this.props.soldCount ?? 0;
  }

  public isAvailable(quantity = 1): boolean {
    return this.props.stock >= quantity;
  }

  public get maxOrderQuantity(): number {
    return Math.min(this.props.stock, MAX_ORDER_QUANTITY);
  }

  /** Keep a flat snapshot for RSC hydration; fromJSON restores the entity on the client. */
  public toJSON(): ProductSnapshot {
    return {
      id: this.props.id,
      sku: this.props.sku,
      title: this.props.title,
      publisher: this.props.publisher,
      description: this.props.description,
      category: this.props.category,
      price: this.props.price.toJSON(),
      stock: this.props.stock,
      imageUrl: this.props.imageUrl,
      rating: this.props.rating,
      soldCount: this.props.soldCount,
    };
  }

  public static fromJSON(value: Product | ProductSnapshot): Product {
    if (value instanceof Product) {
      return value;
    }
    return Product.create({ ...value, price: Money.fromJSON(value.price) });
  }

  public get isOutOfStock(): boolean {
    return this.props.stock <= 0;
  }

  public get isLowStock(): boolean {
    return this.props.stock > 0 && this.props.stock <= LOW_STOCK_THRESHOLD;
  }
}
