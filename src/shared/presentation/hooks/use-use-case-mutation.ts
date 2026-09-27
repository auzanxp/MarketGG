'use client';

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useDI } from '../use-di';
import { type Result } from '@/shared/domain/result';

export interface AnyMutationUseCase<TInput = unknown, TOutput = unknown, TError = Error> {
  execute(input: TInput): Promise<Result<TOutput, TError>>;
}

// Unwrap Result so mutation callbacks receive either the value or the domain error.
export function useUseCaseMutation<
  TUseCase extends { execute(input: TInput): Promise<Result<TOutput, TError>> },
  TInput = Parameters<TUseCase['execute']>[0],
  TOutput = Awaited<ReturnType<TUseCase['execute']>> extends Result<infer O, unknown> ? O : never,
  TError = Awaited<ReturnType<TUseCase['execute']>> extends Result<unknown, infer E> ? E : Error,
>(
  token: symbol,
  options?: UseMutationOptions<TOutput, TError, TInput>
): UseMutationResult<TOutput, TError, TInput> {
  const useCase = useDI<TUseCase>(token);

  return useMutation({
    mutationFn: async (input: TInput) => {
      const result = await useCase.execute(input);
      if (result.isFailure) {
        throw result.error;
      }
      return result.value;
    },
    ...options,
  });
}
