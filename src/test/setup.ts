import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import { server } from '@/mocks/server';
import { mockDb } from '@/mocks/db/mock-db';
import { resetContainer } from '@/shared/infrastructure/di/composition-root';

// Node fetch requires an absolute URL; the test graph still uses the real HTTP adapter.
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api/v1';

if (typeof window === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost:3000',
  });
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
}

function clearAllCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  if (vi.isMockFunction(window.scrollTo)) vi.mocked(window.scrollTo).mockRestore();
  server.resetHandlers();
  mockDb.reset();
  clearAllCookies();
  resetContainer();
});

afterAll(() => {
  server.close();
});
