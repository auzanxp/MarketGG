import { BaseEntity } from '@/shared/domain/base-entity';
import { type Money } from '@/shared/domain/money';
import { formatRelativeTime, toDateTimeAttribute } from '@/shared/domain/relative-time';
import { type OrderStatus } from '@/modules/order/domain/value-objects/order-status';

export interface RecentOrderProps {
  id: string;
  orderNumber: string;
  productSummary: string;
  amount: Money;
  status: OrderStatus;
  placedAt: Date;
}

// Dashboard projection only; full receipt data belongs to the Order aggregate.
export class RecentOrder extends BaseEntity<string> {
  private readonly props: RecentOrderProps;

  private constructor(props: RecentOrderProps) {
    super(props.id);
    this.props = props;
  }

  public static create(props: RecentOrderProps): RecentOrder {
    if (props.orderNumber.trim().length === 0) {
      throw new Error('RecentOrder requires an order number');
    }
    if (Number.isNaN(props.placedAt.getTime())) {
      throw new Error(`RecentOrder received an invalid placedAt for ${props.orderNumber}`);
    }
    return new RecentOrder(props);
  }

  public get orderNumber(): string {
    return this.props.orderNumber;
  }

  public get productSummary(): string {
    return this.props.productSummary;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get status(): OrderStatus {
    return this.props.status;
  }

  public get placedAt(): Date {
    return this.props.placedAt;
  }

  public relativeTime(now?: Date): string {
    return formatRelativeTime(this.props.placedAt, now);
  }

  public get dateTimeAttribute(): string {
    return toDateTimeAttribute(this.props.placedAt);
  }
}
