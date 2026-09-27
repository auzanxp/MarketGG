import { type DomainError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type IHttpClient } from '@/shared/infrastructure/http/http-client.interface';
import { mapApiErrorToDomainError } from '@/shared/infrastructure/http/map-api-error';
import { parseContract } from '@/shared/infrastructure/validation/parse-contract';
import { type Order } from '../../domain/aggregates/order';
import { type CheckoutInput, type IOrderRepository, type OrderFilters, type PaginatedOrders } from '../../domain/repositories/order-repository.interface';
import { mapOrderDtoToDomain } from '../mappers/order.mapper';
import { CheckoutResponseSchema, OrderDtoSchema, OrderListResponseSchema } from '../schemas/order.schema';

export class HttpOrderRepository implements IOrderRepository {
  constructor(private readonly http: IHttpClient) {}

  async checkout(input: CheckoutInput): Promise<Result<Order, DomainError>> {
    try {
      const response = await this.http.post<unknown>('/orders/checkout', input);
      const contract = parseContract(CheckoutResponseSchema, response.data, 'POST /orders/checkout');
      return contract.isFailure ? Result.fail(contract.error) : mapOrderDtoToDomain(contract.value.order, 'POST /orders/checkout');
    } catch (error) { return Result.fail(mapApiErrorToDomainError(error)); }
  }

  async getOrders(filters?: OrderFilters): Promise<Result<PaginatedOrders, DomainError>> {
    try {
      const response = await this.http.get<unknown>('/orders', { params: { status: filters?.status, q: filters?.query, page: filters?.page, limit: filters?.limit } });
      const contract = parseContract(OrderListResponseSchema, response.data, 'GET /orders');
      if (contract.isFailure) return Result.fail(contract.error);
      const orders: Order[] = [];
      for (const dto of contract.value.items) {
        const mapped = mapOrderDtoToDomain(dto, 'GET /orders');
        if (mapped.isFailure) return Result.fail(mapped.error);
        orders.push(mapped.value);
      }
      return Result.ok({ items: orders, ...contract.value.meta });
    } catch (error) { return Result.fail(mapApiErrorToDomainError(error)); }
  }

  async getOrderById(id: string): Promise<Result<Order, DomainError>> {
    try {
      const response = await this.http.get<unknown>(`/orders/${encodeURIComponent(id)}`);
      const contract = parseContract(OrderDtoSchema, response.data, 'GET /orders/:id');
      return contract.isFailure ? Result.fail(contract.error) : mapOrderDtoToDomain(contract.value, 'GET /orders/:id');
    } catch (error) { return Result.fail(mapApiErrorToDomainError(error)); }
  }
}
