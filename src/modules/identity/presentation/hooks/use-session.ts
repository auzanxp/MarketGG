'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type DomainError } from '@/shared/domain/errors';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { useUseCaseMutation } from '@/shared/presentation/hooks/use-use-case-mutation';
import { useUseCaseQuery } from '@/shared/presentation/hooks/use-use-case-query';
import { type GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.usecase';
import { type LogoutUseCase } from '../../application/use-cases/logout.usecase';
import { type User } from '../../domain/entities/user';
import { useCartStore } from '@/modules/cart/presentation/stores/use-cart-store';

export const SESSION_QUERY_KEY = ['identity', 'current-user'] as const;

export interface SessionState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: DomainError | null;
  refetch: () => void;
}

export function useSession(): SessionState {
  const query = useUseCaseQuery<GetCurrentUserUseCase>(
    TOKENS.GetCurrentUserUseCase,
    SESSION_QUERY_KEY,
    undefined,
    {
      retry: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  const user = query.error?.code === 'UNAUTHORIZED' ? null : query.data ?? null;
  return {
    user,
    isLoading: query.isPending,
    isAuthenticated: Boolean(user),
    error: query.error ?? null,
    refetch: () => void query.refetch(),
  };
}

export function useSessionError(error: DomainError | null, userId: string | undefined) {
  const client = useQueryClient();
  useEffect(() => {
    const currentUser = client.getQueryData<User | null>(SESSION_QUERY_KEY);
    if (error?.code === 'UNAUTHORIZED' && userId && currentUser?.id === userId) {
      client.setQueryData(SESSION_QUERY_KEY, null);
    }
  }, [error, userId, client]);
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useUseCaseMutation<LogoutUseCase>(TOKENS.LogoutUseCase, {
    onSettled: () => {
      void useCartStore.getState().setAccount(null);
      queryClient.clear();
      router.replace('/login');
    },
  });
}
