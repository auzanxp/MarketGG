import { type DomainError, ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { MAX_ORDER_QUANTITY } from '@/modules/catalog/domain/entities/product';
import { BillingInfo } from '../../domain/value-objects/billing-info';
import { isPaymentMethod } from '../../domain/value-objects/payment-method';
import { type Order } from '../../domain/aggregates/order';
import { type CheckoutInput, type IOrderRepository } from '../../domain/repositories/order-repository.interface';

export class CheckoutUseCase {
  constructor(private readonly orders: IOrderRepository) {}

  async execute(input: CheckoutInput): Promise<Result<Order, DomainError>> {
    const billing = BillingInfo.create(input.billingInfo);
    if (billing.isFailure) return Result.fail(billing.error);
    if (!isPaymentMethod(input.paymentMethod)) {
      return Result.fail(new ValidationError('Choose a payment method.', { paymentMethod: 'Choose a payment method.' }));
    }
    if (!input.items.length || input.items.some((item) =>
      !item.productId.trim() || !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 || item.quantity > MAX_ORDER_QUANTITY
    ) || new Set(input.items.map((item) => item.productId.trim())).size !== input.items.length) {
      return Result.fail(new ValidationError('Please review the items in your cart.', { items: 'Invalid cart items.' }));
    }
    return this.orders.checkout({
      ...input,
      items: input.items.map((item) => ({ ...item, productId: item.productId.trim() })),
      billingInfo: { fullName: billing.value.fullName, email: billing.value.email.value, phone: billing.value.phone },
    });
  }
}
