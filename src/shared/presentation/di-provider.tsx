'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { type Container } from '../infrastructure/di/container';
import { getContainer } from '../infrastructure/di/composition-root';

const DIContext = createContext<Container | null>(null);

export interface DIProviderProps {
  container?: Container;
  children: React.ReactNode;
}

export function DIProvider({ container, children }: DIProviderProps) {
  const activeContainer = useMemo(() => container || getContainer(), [container]);

  return <DIContext.Provider value={activeContainer}>{children}</DIContext.Provider>;
}

export function useDI<T>(token: symbol): T {
  const container = useContext(DIContext);
  if (!container) {
    throw new Error('useDI must be used within a <DIProvider>');
  }
  return container.resolve<T>(token);
}
