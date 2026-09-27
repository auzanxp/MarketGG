import {
  Heart,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Store,
  Wallet,
} from 'lucide-react';
import type { SidebarNavItem } from '@/components/organisms/app-sidebar';
import { ROUTES } from './routes';

export const PRIMARY_NAV_ITEMS: readonly SidebarNavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.dashboard,
    icon: <LayoutDashboard />,
  },
  {
    label: 'Marketplace',
    href: ROUTES.marketplace,
    icon: <Store />,
    // Product, cart and checkout routes keep Marketplace active in the sidebar.
    matchPaths: ['/products', ROUTES.cart, ROUTES.checkout],
  },
  {
    label: 'Orders',
    href: ROUTES.orders,
    icon: <ReceiptText />,
  },
  {
    label: 'My Favorites',
    href: ROUTES.favorites,
    icon: <Heart />,
    isAvailable: false,
  },
  {
    label: 'Wallet',
    href: ROUTES.wallet,
    icon: <Wallet />,
    isAvailable: false,
  },
  {
    label: 'Settings',
    href: ROUTES.settings,
    icon: <Settings />,
    isAvailable: false,
  },
];
