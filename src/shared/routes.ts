

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  marketplace: '/marketplace',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  favorites: '/favorites',
  wallet: '/wallet',
  settings: '/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const ROUTE_BUILDERS = {
  productDetail: (sku: string): string => `/products/${encodeURIComponent(sku)}`,

  checkoutSuccess: (orderId: string): string =>
    `/checkout/success?order=${encodeURIComponent(orderId)}`,
} as const;

export const ORDER_PARAM = 'order';

export const PUBLIC_ROUTES: readonly string[] = [ROUTES.login];

export const REDIRECT_PARAM = 'next';

export const DEFAULT_AUTHENTICATED_ROUTE: string = ROUTES.dashboard;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function sanitizeRedirectTarget(
  raw: string | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_ROUTE
): string {
  if (typeof raw !== 'string' || raw.length === 0) {
    return fallback;
  }

  if (!raw.startsWith('/')) {
    return fallback;
  }

  if (raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback;
  }

  if (/[\u0000-\u001f\u007f]/.test(raw)) {
    return fallback;
  }

  if (raw === ROUTES.home) {
    return fallback;
  }

  return raw;
}
