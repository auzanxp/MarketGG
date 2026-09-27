import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderHistoryView } from '@/modules/order/presentation/components/order-history-view';

export const metadata: Metadata = {
  title: 'Order History',
  description: 'All your transactions, their status, and their receipts.',
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
      <OrderHistoryView />
    </Suspense>
  );
}
