import type { StatusTone } from '@/components/atoms';
import { type OrderStatus } from '../../domain/value-objects/order-status';

const STATUS_TONES: Record<OrderStatus, StatusTone> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
};

export function orderStatusTone(status: OrderStatus): StatusTone {
  return STATUS_TONES[status];
}

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  COMPLETED: 'Delivered to your account.',
  PENDING: 'Payment is being confirmed.',
  FAILED: 'Payment could not be completed. Please try again.',
};

export function orderStatusDescription(status: OrderStatus): string {
  return STATUS_DESCRIPTIONS[status];
}

const ORDER_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatOrderDateTime(value: Date): string {
  return ORDER_DATE_TIME_FORMATTER.format(value);
}

export { toDateTimeAttribute } from '@/shared/domain/relative-time';
