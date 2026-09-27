export { orderStatusTone } from '@/modules/order/presentation/lib/order-format';

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function getTimeOfDayGreeting(now: Date = new Date()): string {
  const hour = now.getHours();

  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 18) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}
