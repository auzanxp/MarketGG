export const ORDER_STATUSES = ['COMPLETED','PENDING', 'FAILED'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

export function formatOrderStatus(status: OrderStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
