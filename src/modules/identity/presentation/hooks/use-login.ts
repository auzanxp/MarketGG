'use client';

import { useQueryClient } from '@tanstack/react-query';
import { type DomainError } from '@/shared/domain/errors';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { useUseCaseMutation } from '@/shared/presentation/hooks/use-use-case-mutation';
import { type LoginUseCase } from '../../application/use-cases/login.usecase';
import { type AuthSession } from '../../domain/entities/auth-session';
import { SESSION_QUERY_KEY } from './use-session';

export interface UseLoginOptions {
  onSuccess?: (session: AuthSession) => void;
  onError?: (error: DomainError) => void;
}

// Prime the profile cache from login so the next screen can render the current user immediately.
export function useLogin(options?: UseLoginOptions) {
  const queryClient = useQueryClient();

  return useUseCaseMutation<LoginUseCase>(TOKENS.LoginUseCase, {
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session.user);
      options?.onSuccess?.(session);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
