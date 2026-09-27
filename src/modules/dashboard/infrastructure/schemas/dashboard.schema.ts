import { z } from 'zod';
import { ORDER_STATUSES } from '@/modules/order/domain/value-objects/order-status';

const MoneyDtoSchema = z.object({
  amount: z.number(),
  currency: z.string().default('USD'),
});

const CountMetricSchema = z.object({
  value: z.number().nonnegative(),
  deltaPercent: z.number(),
});

const MoneyMetricSchema = z.object({
  value: MoneyDtoSchema,
  deltaPercent: z.number(),
});

export const RecentOrderDtoSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  productSummary: z.string(),
  amount: MoneyDtoSchema,
  status: z.enum(ORDER_STATUSES),
  placedAt: z.string().min(1),
});

export const DashboardSummaryResponseSchema = z.object({
  stats: z.object({
    products: CountMetricSchema,
    ordersToday: CountMetricSchema,
    revenueToday: MoneyMetricSchema,
  }),
  recentOrders: z.array(RecentOrderDtoSchema),
});

export type RecentOrderDto = z.infer<typeof RecentOrderDtoSchema>;
export type DashboardSummaryResponseDto = z.infer<typeof DashboardSummaryResponseSchema>;
