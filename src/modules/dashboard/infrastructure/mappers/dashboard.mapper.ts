import { ContractMismatchError } from '@/shared/domain/errors';
import { Money } from '@/shared/domain/money';
import { Result } from '@/shared/domain/result';
import { DashboardSummary } from '../../domain/entities/dashboard-summary';
import { RecentOrder } from '../../domain/entities/recent-order';
import { MetricDelta } from '../../domain/value-objects/metric-delta';
import {
  type DashboardSummaryResponseDto,
  type RecentOrderDto,
} from '../schemas/dashboard.schema';

function mapRecentOrder(
  dto: RecentOrderDto,
  context: string
): Result<RecentOrder, ContractMismatchError> {
  const placedAt = new Date(dto.placedAt);

  if (Number.isNaN(placedAt.getTime())) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: order ${JSON.stringify(dto.orderNumber)} has an unparseable placedAt (${JSON.stringify(dto.placedAt)})`
      )
    );
  }

  try {
    return Result.ok(
      RecentOrder.create({
        id: dto.id,
        orderNumber: dto.orderNumber,
        productSummary: dto.productSummary,
        amount: Money.create(dto.amount.amount, dto.amount.currency),
        status: dto.status,
        placedAt,
      })
    );
  } catch (error: unknown) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: order ${JSON.stringify(dto.orderNumber)} — ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
}

export function mapDashboardSummaryToDomain(
  dto: DashboardSummaryResponseDto,
  context = 'GET /dashboard/summary'
): Result<DashboardSummary, ContractMismatchError> {
  const recentOrders: RecentOrder[] = [];

  for (const orderDto of dto.recentOrders) {
    const mapped = mapRecentOrder(orderDto, context);
    if (mapped.isFailure) {
      return Result.fail(mapped.error);
    }
    recentOrders.push(mapped.value);
  }

  try {
    return Result.ok(
      DashboardSummary.create({
        stats: {
          totalProducts: dto.stats.products.value,
          productsDelta: MetricDelta.create(dto.stats.products.deltaPercent),
          ordersToday: dto.stats.ordersToday.value,
          ordersDelta: MetricDelta.create(dto.stats.ordersToday.deltaPercent),
          revenueToday: Money.create(
            dto.stats.revenueToday.value.amount,
            dto.stats.revenueToday.value.currency
          ),
          revenueDelta: MetricDelta.create(dto.stats.revenueToday.deltaPercent),
        },
        recentOrders,
      })
    );
  } catch (error: unknown) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
}
