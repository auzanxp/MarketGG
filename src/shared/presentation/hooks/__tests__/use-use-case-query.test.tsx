import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DIProvider } from '../../di-provider';
import { Container } from '@/shared/infrastructure/di/container';
import { Result } from '@/shared/domain/result';
import { useUseCaseQuery } from '../use-use-case-query';
import { useUseCaseMutation } from '../use-use-case-mutation';

const TEST_TOKENS = {
  GetGreetingUseCase: Symbol.for('GetGreetingUseCase'),
  CreatePostUseCase: Symbol.for('CreatePostUseCase'),
};

class GetGreetingUseCase {
  public async execute(name?: string) {
    if (name === 'error') {
      return Result.fail(new Error('Name cannot be error'));
    }
    return Result.ok(`Hello, ${name || 'World'}!`);
  }
}

class CreatePostUseCase {
  public async execute(data: { title: string }) {
    if (!data.title) {
      return Result.fail(new Error('Title is required'));
    }
    return Result.ok({ id: 'post-1', title: data.title });
  }
}

function createWrapper() {
  const container = new Container();
  container.register(TEST_TOKENS.GetGreetingUseCase, () => new GetGreetingUseCase());
  container.register(TEST_TOKENS.CreatePostUseCase, () => new CreatePostUseCase());

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DIProvider container={container}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </DIProvider>
    );
  };
}

describe('useUseCaseQuery & useUseCaseMutation', () => {
  it('should resolve use case and unwrap successful Result into data', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () =>
        useUseCaseQuery<GetGreetingUseCase>(
          TEST_TOKENS.GetGreetingUseCase,
          ['greeting', 'Alice'],
          'Alice'
        ),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('Hello, Alice!');
  });

  it('should capture failed Result as TanStack Query error', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () =>
        useUseCaseQuery<GetGreetingUseCase>(
          TEST_TOKENS.GetGreetingUseCase,
          ['greeting', 'error'],
          'error'
        ),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Name cannot be error');
  });

  it('should execute mutation and return result via useUseCaseMutation', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUseCaseMutation<CreatePostUseCase>(TEST_TOKENS.CreatePostUseCase),
      { wrapper }
    );

    result.current.mutate({ title: 'Clean Architecture with React 19' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      id: 'post-1',
      title: 'Clean Architecture with React 19',
    });
  });
});
