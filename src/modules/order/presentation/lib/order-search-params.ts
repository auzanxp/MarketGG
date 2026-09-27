import type { FilterTabItem } from '@/components/molecules';
import { parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs';
import { ORDER_STATUSES, formatOrderStatus } from '../../domain/value-objects/order-status';

export const ORDER_STATUS_FILTER_ALL = 'all';

export const ORDER_STATUS_FILTERS = [ORDER_STATUS_FILTER_ALL, ...ORDER_STATUSES] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];
export const orderSearchParams = {
  status: parseAsStringEnum<OrderStatusFilter>([...ORDER_STATUS_FILTERS]).withDefault(ORDER_STATUS_FILTER_ALL),
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
};

export const ORDER_STATUS_TAB_ITEMS: ReadonlyArray<FilterTabItem<OrderStatusFilter>> =
  ORDER_STATUS_FILTERS.map((value) => ({
    value,
    label: value === ORDER_STATUS_FILTER_ALL ? 'All' : formatOrderStatus(value),
  }));
