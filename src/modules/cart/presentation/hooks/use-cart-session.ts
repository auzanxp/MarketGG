'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/modules/identity/presentation/hooks/use-session';
import { ROUTES, REDIRECT_PARAM } from '@/shared/routes';
import { useCartStore } from '../stores/use-cart-store';

// Restore the basket only after resolving its account owner.
export function useCartSession() {
  const session = useSession();
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const userId = session.user?.id ?? null;
  const setAccount = useCartStore((state) => state.setAccount);
  useEffect(() => {
    if (session.isLoading) return;
    void setAccount(userId);
    if (!userId && (!session.error || session.error.code === 'UNAUTHORIZED')) {
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'identity' });
      router.replace(`${ROUTES.login}?${REDIRECT_PARAM}=${encodeURIComponent(pathname + window.location.search)}`);
    }
  }, [userId, session.isLoading, session.error, setAccount, router, pathname, client]);
  return session;
}

export function useCartReady() {
  const { user, isLoading } = useSession();
  const ready = useCartStore((state) => state.isHydrated && state.userId === user?.id);
  return !isLoading && Boolean(user) && ready;
}
