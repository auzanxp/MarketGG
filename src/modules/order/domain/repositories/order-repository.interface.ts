import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type PaginatedResult, type PaginationParams } from '@/shared/domain/pagination';
import { type Order } from '../aggregates/order';
import { type BillingInfoInput } from '../value-objects/billing-info';
import { type PaymentMethod } from '../value-objects/payment-method';
import { type OrderStatus } from '../value-objects/order-status';

export interface CheckoutInput {
  items: ReadonlyArray<{ productId: string; quantity: number }>;
  billingInfo: BillingInfoInput;
  paymentMethod: PaymentMethod;
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus;
  query?: string;
}

export type PaginatedOrders = PaginatedResult<Order>;

export interface IOrderRepository {
  checkout(input: CheckoutInput): Promise<Result<Order, DomainError>>;
  getOrders(filters?: OrderFilters): Promise<Result<PaginatedOrders, DomainError>>;
  getOrderById(id: string): Promise<Result<Order, DomainError>>;
}
