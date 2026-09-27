import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  ContractMismatchError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from '@/shared/domain/errors';
import { ApiError } from '../problem-details';
import { mapApiErrorToDomainError } from '../map-api-error';

describe('mapApiErrorToDomainError', () => {
  it('maps status 0 to a network error', () => {
    const result = mapApiErrorToDomainError(
      new ApiError({ title: 'Network Error', status: 0, detail: 'Offline' })
    );

    expect(result).toBeInstanceOf(NetworkError);
    expect(result.code).toBe('NETWORK');
  });

  it('maps 401 to unauthorized and preserves the server copy', () => {
    const result = mapApiErrorToDomainError(
      new ApiError({
        title: 'Invalid Credentials',
        status: 401,
        detail: 'The email or password you entered is incorrect.',
      })
    );

    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(result.message).toBe('The email or password you entered is incorrect.');
  });

  it('maps 403 to forbidden and 404 to not found', () => {
    expect(
      mapApiErrorToDomainError(new ApiError({ title: 'x', status: 403, detail: 'nope' }))
    ).toBeInstanceOf(ForbiddenError);
    expect(
      mapApiErrorToDomainError(new ApiError({ title: 'x', status: 404, detail: 'gone' }))
    ).toBeInstanceOf(NotFoundError);
  });

  describe('validation errors', () => {
    it('maps 422 to a validation error carrying field messages', () => {
      const result = mapApiErrorToDomainError(
        new ApiError({
          title: 'Validation Failed',
          status: 422,
          detail: 'Please check the highlighted fields and try again.',
          errors: { email: 'Email is required.', password: 'Password is required.' },
        })
      );

      expect(result).toBeInstanceOf(ValidationError);
      expect((result as ValidationError).fieldErrors).toEqual({
        email: 'Email is required.',
        password: 'Password is required.',
      });
    });

    it('collapses array-valued field errors to the first message', () => {
      const result = mapApiErrorToDomainError(
        new ApiError({
          title: 'Validation Failed',
          status: 400,
          detail: 'Bad input',
          errors: { email: ['Email is required.', 'Email must be unique.'] },
        })
      );

      expect((result as ValidationError).fieldErrors).toEqual({ email: 'Email is required.' });
    });

    it('still produces a validation error when no field detail was sent', () => {
      const result = mapApiErrorToDomainError(
        new ApiError({ title: 'Validation Failed', status: 422, detail: 'Bad input' })
      );

      expect(result).toBeInstanceOf(ValidationError);
      expect((result as ValidationError).fieldErrors).toEqual({});
    });
  });

  it('maps 409 to a conflict and keeps the meta payload', () => {
    const raw = {
      type: 'stock-conflict',
      title: 'Stock Conflict',
      status: 409,
      detail: 'Only 2 left.',
      meta: { productId: 'prod-3', availableStock: 2, requestedQuantity: 99 },
    };

    const result = mapApiErrorToDomainError(
      new ApiError(raw, raw)
    );

    expect(result).toBeInstanceOf(ConflictError);
    expect((result as ConflictError).meta).toEqual({
      productId: 'prod-3',
      availableStock: 2,
      requestedQuantity: 99,
    });
  });

  describe('rate limiting', () => {
    it('reads retryAfterSeconds from meta', () => {
      const result = mapApiErrorToDomainError(
        new ApiError(
          { title: 'Too Many Attempts', status: 429, detail: 'Wait.', meta: { retryAfterSeconds: 45 } }
        )
      );

      expect(result).toBeInstanceOf(RateLimitError);
      expect((result as RateLimitError).retryAfterSeconds).toBe(45);
    });

    it('defaults to 30 seconds when the server omits it', () => {
      const result = mapApiErrorToDomainError(
        new ApiError({ title: 'Too Many Attempts', status: 429, detail: 'Wait.' })
      );

      expect((result as RateLimitError).retryAfterSeconds).toBe(30);
    });
  });

  describe('server errors', () => {
    it('hides 5xx detail behind generic copy', () => {
      const result = mapApiErrorToDomainError(
        new ApiError({
          title: 'Internal Server Error',
          status: 500,
          detail: 'NullPointerException at OrderService.java:412',
        })
      );

      expect(result).toBeInstanceOf(UnexpectedError);
      expect(result.message).not.toContain('NullPointerException');
    });
  });

  it('passes an existing domain error straight through', () => {
    const original = new ContractMismatchError('GET /auth/me: email is not valid');

    expect(mapApiErrorToDomainError(original)).toBe(original);
  });

  it('normalises anything unrecognised into an unexpected error', () => {
    expect(mapApiErrorToDomainError(new Error('boom'))).toBeInstanceOf(UnexpectedError);
    expect(mapApiErrorToDomainError('a thrown string')).toBeInstanceOf(UnexpectedError);
    expect(mapApiErrorToDomainError(undefined)).toBeInstanceOf(UnexpectedError);
  });
});
