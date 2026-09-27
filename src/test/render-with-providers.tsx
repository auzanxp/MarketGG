import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { type Container } from '@/shared/infrastructure/di/container';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { DIProvider } from '@/shared/presentation/di-provider';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  diContainer?: Container;
  queryClient?: QueryClient;
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderWithProvidersResult extends RenderResult {
  diContainer: Container;
  queryClient: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactNode,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const {
    diContainer = createContainer(),
    queryClient = createTestQueryClient(),
    searchParams = '',
    onUrlUpdate,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DIProvider container={diContainer}>
        <QueryClientProvider client={queryClient}>
          <NuqsTestingAdapter hasMemory searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
            {children}
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </DIProvider>
    );
  }

  const result = render(<>{ui}</>, { wrapper: Wrapper, ...renderOptions });

  return { ...result, diContainer, queryClient };
}
