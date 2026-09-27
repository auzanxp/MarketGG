import { ApiError } from './problem-details';
import {
  ConflictError,
  type DomainError,
  type FieldErrors,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
  isDomainError,
  toDomainError,
} from '@/shared/domain/errors';

// A field may contain several API messages; the form displays the first one.
function normaliseFieldErrors(errors: Record<string, string | string[]> | undefined): FieldErrors {
  if (!errors) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      const [first] = value;
      if (typeof first === 'string') {
        result[field] = first;
      }
    } else if (typeof value === 'string') {
      result[field] = value;
    }
  }
  return result;
}

function readRetryAfterSeconds(error: ApiError): number {
  const meta = error.meta ?? {};
  const candidate = meta.retryAfterSeconds ?? meta.retryAfter;
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : 30;
}

export function mapApiErrorToDomainError(error: unknown): DomainError {
  if (isDomainError(error)) {
    return error;
  }

  if (!(error instanceof ApiError)) {
    return toDomainError(error);
  }

  // Status 0 represents a transport failure without an HTTP response.
  if (error.status === 0) {
    return new NetworkError(undefined, { cause: error });
  }

  switch (error.status) {
    case 400:
    case 422:
      return new ValidationError(error.detail, normaliseFieldErrors(error.errors), { cause: error });
    case 401:
      return new UnauthorizedError(error.detail, { cause: error });
    case 403:
      return new ForbiddenError(error.detail, { cause: error });
    case 404:
      return new NotFoundError(error.detail, { cause: error });
    case 409:
      return new ConflictError(error.detail, error.meta ?? {}, { cause: error });
    case 429:
      return new RateLimitError(error.detail, readRetryAfterSeconds(error), { cause: error });
    default:
      // Do not expose server diagnostics in user-facing errors.
      return error.status >= 500
        ? new UnexpectedError(undefined, { cause: error })
        : new UnexpectedError(error.detail, { cause: error });
  }
}
