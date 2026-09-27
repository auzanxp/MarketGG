import { NextResponse, type NextRequest } from 'next/server';
import {
  isSessionExpired,
  readSessionFromCookieString,
} from '@/shared/infrastructure/storage/session-cookie';
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  REDIRECT_PARAM,
  ROUTES,
  isPublicRoute,
  sanitizeRedirectTarget,
} from '@/shared/routes';

// This unsigned mock cookie is a navigation guard. APIs still validate the bearer token.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = readSessionFromCookieString(request.headers.get('cookie'));
  const isAuthenticated = session !== null && !isSessionExpired(session);
  const isPublic = isPublicRoute(pathname);

  if (!isAuthenticated && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.search = '';
    loginUrl.searchParams.set(REDIRECT_PARAM, `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublic) {
    const target = sanitizeRedirectTarget(
      request.nextUrl.searchParams.get(REDIRECT_PARAM),
      DEFAULT_AUTHENTICATED_ROUTE
    );
    return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude API responses, worker registration and static assets from login redirects.
  matcher: [
    '/((?!api/|_next/|mockServiceWorker\\.js|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest)$).*)',
  ],
};
