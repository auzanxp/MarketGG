import { BaseEntity } from '@/shared/domain/base-entity';
import { Money } from '@/shared/domain/money';
import { type PriceBreakdown } from '@/shared/domain/price-breakdown';
import { type BillingInfo } from '../value-objects/billing-info';
import { type PaymentMethod } from '../value-objects/payment-method';
import { type OrderStatus } from '../value-objects/order-status';

export interface OrderItemProps {
  productId: string;
  sku: string;
  title: string;
  imageUrl: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
}

export interface OrderProps {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  items: readonly OrderItemProps[];
  totalAmount: Money;
  priceBreakdown: PriceBreakdown;
  billingInfo: BillingInfo;
  paymentMethod: PaymentMethod;
}

export class Order extends BaseEntity<string> {
  private readonly props: OrderProps;

  private constructor(props: OrderProps) {
    super(props.id);
    this.props = props;
  }

  public static create(props: OrderProps): Order {
    if (!props.items.length || Number.isNaN(props.createdAt.getTime())) {
      throw new Error('Order requires items and a valid creation date');
    }
    const subtotal = props.items.reduce((sum, item) => {
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
          item.unitPrice.multiply(item.quantity).amount !== item.totalPrice.amount ||
          item.unitPrice.currency !== item.totalPrice.currency) {
        throw new Error('Invalid order line');
      }
      return sum.add(item.totalPrice);
    }, Money.zero(props.totalAmount.currency));
    if (subtotal.amount !== props.priceBreakdown.subtotal.amount ||
        props.priceBreakdown.total.amount !== props.totalAmount.amount ||
        props.priceBreakdown.total.currency !== props.totalAmount.currency) {
      throw new Error('Order totals do not match its receipt');
    }
    return new Order(props);
  }

  public get orderNumber(): string {
    return this.props.orderNumber;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get status(): OrderStatus {
    return this.props.status;
  }

  public get items(): readonly OrderItemProps[] {
    return this.props.items;
  }

  public get totalAmount(): Money {
    return this.props.totalAmount;
  }

  public get priceBreakdown() { return this.props.priceBreakdown; }
  public get billingInfo() { return this.props.billingInfo; }
  public get paymentMethod() { return this.props.paymentMethod; }
}
