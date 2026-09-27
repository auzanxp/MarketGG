'use client';

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useDI } from '../use-di';
import { type Result } from '@/shared/domain/result';

export interface AnyUseCase<TInput = unknown, TOutput = unknown, TError = Error> {
  execute(input: TInput): Promise<Result<TOutput, TError>>;
}

// Unwrap Result so TanStack Query handles domain failures through its error state.
export function useUseCaseQuery<
  TUseCase extends { execute(input: TInput): Promise<Result<TOutput, TError>> },
  TInput = Parameters<TUseCase['execute']>[0],
  TOutput = Awaited<ReturnType<TUseCase['execute']>> extends Result<infer O, unknown> ? O : never,
  TError = Awaited<ReturnType<TUseCase['execute']>> extends Result<unknown, infer E> ? E : Error,
  TData = TOutput,
>(
  token: symbol,
  queryKey: QueryKey,
  input?: TInput,
  options?: Omit<UseQueryOptions<TOutput, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  const useCase = useDI<TUseCase>(token);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await useCase.execute(input as TInput);
      if (result.isFailure) {
        throw result.error;
      }
      return result.value;
    },
    ...options,
  });
}
