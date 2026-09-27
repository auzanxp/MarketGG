let mswInitPromise: Promise<void> | null = null;

export async function initMsw(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false';
  if (!isEnabled) {
    return;
  }

  if (!mswInitPromise) {
    mswInitPromise = (async () => {
      const { worker } = await import('./browser');
      const { mockDb } = await import('./db/mock-db');
      const { toast } = await import('sonner');
      try {
        const warning = mockDb.enablePersistence(window.localStorage);
        if (warning) toast.warning(warning);
      } catch {
        toast.warning('Browser storage is unavailable. Demo data will last until refresh.');
      }
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.info('[MSW] Mock Service Worker ready in browser.');
    })().catch((error) => {
      mswInitPromise = null;
      throw error;
    });
  }

  return mswInitPromise;
}
