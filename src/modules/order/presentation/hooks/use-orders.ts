'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { useUseCaseQuery } from '@/shared/presentation/hooks/use-use-case-query';
import { useUseCaseMutation } from '@/shared/presentation/hooks/use-use-case-mutation';
import { ROUTE_BUILDERS } from '@/shared/routes';
import { useCartStore } from '@/modules/cart/presentation/stores/use-cart-store';
import { SESSION_QUERY_KEY, useSession, useSessionError } from '@/modules/identity/presentation/hooks/use-session';
import { DASHBOARD_SUMMARY_QUERY_KEY } from '@/modules/dashboard/presentation/hooks/use-dashboard-summary';
import { type CheckoutUseCase } from '../../application/use-cases/checkout.usecase';
import { type GetOrdersUseCase } from '../../application/use-cases/get-orders.usecase';
import { type GetOrderDetailUseCase } from '../../application/use-cases/get-order-detail.usecase';
import { type OrderFilters } from '../../domain/repositories/order-repository.interface';

export const orderDetailQueryKey = (userId: string, orderId: string) => ['orders', userId, 'detail', orderId] as const;

export function useOrders(filters: OrderFilters) {
  const { user } = useSession();
  const query = useUseCaseQuery<GetOrdersUseCase>(TOKENS.GetOrdersUseCase, ['orders', user?.id, 'list', filters], filters, { enabled: Boolean(user) });
  useSessionError(query.error, user?.id);
  return query;
}

export function useOrderDetail(orderId: string) {
  const { user } = useSession();
  const query = useUseCaseQuery<GetOrderDetailUseCase>(TOKENS.GetOrderDetailUseCase, orderDetailQueryKey(user?.id ?? '', orderId), orderId, { enabled: Boolean(user && orderId) });
  useSessionError(query.error, user?.id);
  return query;
}

export function useCheckout() {
  const client = useQueryClient();
  const router = useRouter();
  const { user } = useSession();
  return useUseCaseMutation<CheckoutUseCase>(TOKENS.CheckoutUseCase, {
    retry: false,
    onSuccess: (order) => {
      // A response from the previous session must never clear another account's cart.
      if (!user || useCartStore.getState().userId !== user.id) return;
      client.setQueryData(orderDetailQueryKey(user.id, order.id), order);
      if (order.status !== 'FAILED') useCartStore.getState().clearCart();
      void Promise.all([
        client.invalidateQueries({ queryKey: ['orders', user.id, 'list'] }),
        client.invalidateQueries({ queryKey: ['catalog', 'products'] }),
        client.invalidateQueries({ queryKey: ['product'] }),
        client.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY }),
      ]);
      router.replace(ROUTE_BUILDERS.checkoutSuccess(order.id));
    },
    onError: (error) => {
      if (!user || useCartStore.getState().userId !== user.id) return;
      if (error.code === 'UNAUTHORIZED') client.setQueryData(SESSION_QUERY_KEY, null);
      if (error.code === 'CONFLICT') {
        void client.invalidateQueries({ queryKey: ['catalog', 'products'] });
        void client.invalidateQueries({ queryKey: ['product'] });
      }
    },
  });
}
