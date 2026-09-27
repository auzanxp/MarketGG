import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  ROUTES,
  ROUTE_BUILDERS,
  isPublicRoute,
  sanitizeRedirectTarget,
} from '../routes';

describe('productDetail route', () => {
  it('keeps the SKU and encodes reserved URL characters', () => {
    expect(ROUTE_BUILDERS.productDetail('MLBB-DIAMOND-086')).toBe('/products/MLBB-DIAMOND-086');
    expect(ROUTE_BUILDERS.productDetail('SKU /?#%')).toBe('/products/SKU%20%2F%3F%23%25');
  });
});

describe('isPublicRoute', () => {
  it('treats the login route and its children as public', () => {
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/login/callback')).toBe(true);
  });

  it('treats everything else as protected', () => {
    expect(isPublicRoute('/')).toBe(false);
    expect(isPublicRoute('/marketplace')).toBe(false);
    expect(isPublicRoute('/orders/123')).toBe(false);
  });

  it('does not let a similar prefix slip through', () => {
    expect(isPublicRoute('/login-help')).toBe(false);
  });
});

describe('sanitizeRedirectTarget', () => {
  it('keeps a site-relative path, including its query string', () => {
    expect(sanitizeRedirectTarget('/marketplace')).toBe('/marketplace');
    expect(sanitizeRedirectTarget('/marketplace?category=Games')).toBe('/marketplace?category=Games');
  });

  it('falls back when nothing was requested', () => {
    expect(sanitizeRedirectTarget(undefined)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    expect(sanitizeRedirectTarget(null)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    expect(sanitizeRedirectTarget('')).toBe(DEFAULT_AUTHENTICATED_ROUTE);
  });

  it('sends the site root to the default landing route to avoid a redirect loop', () => {
    expect(sanitizeRedirectTarget(ROUTES.home)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
  });

  describe('open-redirect protection', () => {
    const hostileTargets = [
      'https://evil.example/phish',
      'http://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'mailto:someone@evil.example',
      'marketplace',
    ];

    it.each(hostileTargets)('rejects %s', (target) => {
      expect(sanitizeRedirectTarget(target)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    });

    it('rejects targets containing control characters', () => {
      expect(sanitizeRedirectTarget('/market\nplace')).toBe(DEFAULT_AUTHENTICATED_ROUTE);
      expect(sanitizeRedirectTarget('/\u0000//evil.example')).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    });
  });

  it('honours a custom fallback', () => {
    expect(sanitizeRedirectTarget('https://evil.example', '/somewhere-safe')).toBe('/somewhere-safe');
  });
});
