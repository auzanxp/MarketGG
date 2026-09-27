'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { BrandLogo } from '@/components/atoms';
import { SearchField } from '@/components/molecules';
import { AppSidebar, AppTopBar, type SidebarNavItem } from '@/components/organisms';
import { AppShellTemplate } from '@/components/templates';
import { CartButton } from '@/modules/cart/presentation/components/cart-button';
import { useCartSession } from '@/modules/cart/presentation/hooks/use-cart-session';
import { AlertBanner } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/modules/identity/presentation/components/user-menu';
import { useLogout } from '@/modules/identity/presentation/hooks/use-session';
import { PRIMARY_NAV_ITEMS } from '@/shared/navigation';
import { ROUTES } from '@/shared/routes';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const session = useCartSession();

  const [globalSearch, setGlobalSearch] = React.useState('');

  const handleUnavailable = React.useCallback((item: SidebarNavItem) => {
    toast.info(`${item.label} is not part of this iteration yet.`, {
      description: 'Favorites, Wallet, and Settings are still to come.',
    });
  }, []);

  const sidebar = (
    <AppSidebar
      items={PRIMARY_NAV_ITEMS}
      activePath={pathname}
      onUnavailableSelect={handleUnavailable}
      brand={
        <Link
          href={ROUTES.dashboard}
          aria-label="VocaMarket home"
          className="inline-flex rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <BrandLogo size="md" />
        </Link>
      }
      footer={
        <button
          type="button"
          onClick={() => logout.mutate(undefined)}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive-subtle hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
          {logout.isPending ? 'Signing out…' : 'Logout'}
        </button>
      }
    />
  );

  const topbar = (
    <AppTopBar
      search={
        <form
          role="search"
          aria-label="Global product search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = globalSearch.trim();
            const params = new URLSearchParams({ q: query });
            router.push(query ? `${ROUTES.marketplace}?${params}` : ROUTES.marketplace);
            setGlobalSearch('');
          }}
        >
          <SearchField
            label="Search products, games, categories"
            placeholder="Search products, games, categories..."
            value={globalSearch}
            onValueChange={setGlobalSearch}
            enterKeyHint="search"
            size="md"
          />
        </form>
      }
      actions={
        <>
          <CartButton />
          <button
            type="button"
            onClick={() =>
              toast.info('Notifications are not part of this iteration yet.', {
                description: 'The notification feed is its own piece of work.',
              })
            }
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Bell className="size-5" aria-hidden="true" />

            <span
              aria-hidden="true"
              className="absolute top-2 right-2 size-1.5 rounded-full bg-primary"
            />
          </button>
        </>
      }
      user={<UserMenu />}
    />
  );

  return (
    <AppShellTemplate sidebar={sidebar} topbar={topbar}>
      {session.error && session.error.code !== 'UNAUTHORIZED' && (
        <AlertBanner tone="error" title="Could not restore your session" className="mb-6">
          <p>{session.error.message}</p>
          <Button variant="outline" size="sm" onClick={session.refetch}>Try again</Button>
        </AlertBanner>
      )}
      {children}
    </AppShellTemplate>
  );
}
