import { type DomainError, ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type Order } from '../../domain/aggregates/order';
import { type IOrderRepository } from '../../domain/repositories/order-repository.interface';

export class GetOrderDetailUseCase {
  constructor(private readonly orders: IOrderRepository) {}
  execute(id: string): Promise<Result<Order, DomainError>> {
    if (!id.trim()) return Promise.resolve(Result.fail(new ValidationError('An order id is required.')));
    return this.orders.getOrderById(id.trim());
  }
}
