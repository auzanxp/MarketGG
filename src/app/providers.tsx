'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { DIProvider } from '@/shared/presentation/di-provider';
import { MSWProvider } from '@/mocks/msw-provider';
import { getQueryClient } from '@/shared/infrastructure/query/get-query-client';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <MSWProvider>
      <DIProvider>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="top-right" richColors />
        </QueryClientProvider>
      </DIProvider>
    </MSWProvider>
  );
}
