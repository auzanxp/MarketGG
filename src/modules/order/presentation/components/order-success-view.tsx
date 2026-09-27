'use client';

import { ReceiptText, RotateCcw } from 'lucide-react';
import { ButtonLink } from '@/components/atoms';
import { AlertBanner, EmptyState } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/shared/routes';
import { useOrderDetail } from '../hooks/use-orders';
import { OrderSuccessPanel } from './order-success-panel';

export function OrderSuccessView({ orderId }: { orderId: string }) {
  const query = useOrderDetail(orderId);
  if (!orderId || query.error?.code === 'NOT_FOUND') {
    return <EmptyState icon={<ReceiptText />} title="Order not found" description="Open your order history to find your purchase."
      action={<ButtonLink href={ROUTES.orders}>View Order History</ButtonLink>} />;
  }
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-sm rounded-2xl" />;
  if (query.isError) return (
    <AlertBanner tone="error" title="Could not load your order">
      <p>{query.error.message}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => void query.refetch()}><RotateCcw aria-hidden="true" />Try again</Button>
    </AlertBanner>
  );
  return <OrderSuccessPanel orderNumber={query.data.orderNumber} status={query.data.status} />;
}
