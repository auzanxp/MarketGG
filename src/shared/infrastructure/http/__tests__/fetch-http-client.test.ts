import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { FetchHttpClient } from '../fetch-http-client';
import { mapApiErrorToDomainError } from '../map-api-error';
import { ApiError } from '../problem-details';

afterEach(() => vi.restoreAllMocks());

describe('HTTP error contracts', () => {
  const client = new FetchHttpClient();

  it('uses the HTTP status even when the problem body reports another status', async () => {
    server.use(http.get('*/api/v1/products', () => HttpResponse.json({
      title: 'Stock Conflict', status: 500, detail: 'Only one left.', meta: { availableStock: 1 },
    }, { status: 409, headers: { 'Content-Type': 'application/problem+json' } })));
    const error = await client.get('/products').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, meta: { availableStock: 1 } });
    expect(mapApiErrorToDomainError(error).code).toBe('CONFLICT');
  });

  it('preserves validation messages supplied as strings and arrays', async () => {
    server.use(http.get('*/api/v1/products', () => HttpResponse.json({
      title: 'Validation Error', status: 422, detail: 'Check the fields.',
      errors: { email: ['Email is invalid.', 'Email is required.'], phone: 'Phone is invalid.' },
    }, { status: 422 })));
    const error = await client.get('/products').catch((caught: unknown) => caught);
    expect(mapApiErrorToDomainError(error)).toMatchObject({
      code: 'VALIDATION', fieldErrors: { email: 'Email is invalid.', phone: 'Phone is invalid.' },
    });
  });

  it.each([
    ['HTML', () => HttpResponse.html('<pre>Database password: secret</pre>', { status: 503 })],
    ['invalid JSON', () => new HttpResponse('{broken', { status: 503, headers: { 'Content-Type': 'application/json' } })],
    ['empty body', () => new HttpResponse(null, { status: 503 })],
    ['invalid fields', () => HttpResponse.json({ title: 'Failure', status: 503, detail: 'secret', errors: { email: 42 }, meta: [] }, { status: 503 })],
  ] as const)('handles %s without exposing the body to users', async (_label, respond) => {
    server.use(http.get('*/api/v1/products', respond));
    const error = await client.get('/products').catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 503, detail: 'The request could not be completed. Please try again.' });
    expect(mapApiErrorToDomainError(error).code).toBe('UNEXPECTED');
    expect(mapApiErrorToDomainError(error).message).not.toContain('secret');
  });

  it('does not use metadata from a malformed problem body', async () => {
    server.use(http.get('*/api/v1/products', () => HttpResponse.json({
      status: 409, meta: { availableStock: 'invalid' },
    }, { status: 409 })));
    const error = await client.get('/products').catch((caught: unknown) => caught);
    expect(mapApiErrorToDomainError(error)).toMatchObject({ code: 'CONFLICT', meta: {} });
  });

  it('keeps network failures separate from backend responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const error = await client.get('/products').catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 0 });
    expect(mapApiErrorToDomainError(error).code).toBe('NETWORK');
  });
});
