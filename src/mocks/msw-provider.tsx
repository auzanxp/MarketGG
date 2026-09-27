'use client';

import React, { useEffect } from 'react';
import { initMsw } from './init-msw';

export interface MSWProviderProps {
  children: React.ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  useEffect(() => {
    initMsw().catch((err) => {
      console.error('[MSWProvider] Failed to initialize MSW:', err);
    });
  }, []);

  return <>{children}</>;
}
