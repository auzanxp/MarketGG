import type { Metadata } from 'next';
import { OrderSuccessView } from '@/modules/order/presentation/components/order-success-view';
import { ORDER_PARAM } from '@/shared/routes';

export const metadata: Metadata = { title: 'Order Confirmation', description: 'View your order status.' };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params[ORDER_PARAM];
  const orderId = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  return <OrderSuccessView orderId={orderId} />;
}
