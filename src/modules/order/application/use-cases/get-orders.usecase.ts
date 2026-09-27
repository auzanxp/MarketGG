import { type IOrderRepository, type OrderFilters } from '../../domain/repositories/order-repository.interface';
import { normalisePagination } from '@/shared/domain/pagination';

export class GetOrdersUseCase {
  constructor(private readonly orders: IOrderRepository) {}
  execute(filters?: OrderFilters) {
    return this.orders.getOrders({ ...filters, ...normalisePagination(filters), query: filters?.query?.trim() || undefined });
  }
}
