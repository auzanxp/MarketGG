import { ContractMismatchError } from '@/shared/domain/errors';
import { Money } from '@/shared/domain/money';
import { PriceBreakdown } from '@/shared/domain/price-breakdown';
import { Result } from '@/shared/domain/result';
import { Order } from '../../domain/aggregates/order';
import { BillingInfo } from '../../domain/value-objects/billing-info';
import { type OrderDto } from '../schemas/order.schema';

export function mapOrderDtoToDomain(dto: OrderDto, context: string): Result<Order, ContractMismatchError> {
  try {
    const billing = BillingInfo.create(dto.billingInfo);
    if (billing.isFailure) throw billing.error;
    return Result.ok(Order.create({
      ...dto,
      createdAt: new Date(dto.createdAt),
      items: dto.items.map((item) => ({ ...item, unitPrice: Money.fromJSON(item.unitPrice), totalPrice: Money.fromJSON(item.totalPrice) })),
      totalAmount: Money.fromJSON(dto.totalAmount),
      priceBreakdown: PriceBreakdown.fromJSON(dto.priceBreakdown),
      billingInfo: billing.value,
    }));
  } catch (cause) {
    return Result.fail(new ContractMismatchError(`${context}: invalid order`, { cause }));
  }
}
