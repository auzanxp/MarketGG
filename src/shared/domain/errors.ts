
export type DomainErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'CONTRACT_MISMATCH'
  | 'UNEXPECTED';

export type FieldErrors = Readonly<Record<string, string>>;

export abstract class DomainError extends Error {
  public abstract readonly code: DomainErrorCode;

  protected constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export class ValidationError extends DomainError {
  public readonly code = 'VALIDATION' as const;
  public readonly fieldErrors: FieldErrors;

  constructor(
    message = 'Please check the highlighted fields and try again.',
    fieldErrors: FieldErrors = {},
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.fieldErrors = Object.freeze({ ...fieldErrors });
  }
}

export class UnauthorizedError extends DomainError {
  public readonly code = 'UNAUTHORIZED' as const;

  constructor(message = 'Your session has expired. Please sign in again.', options?: { cause?: unknown }) {
    super(message, options);
  }
}

export class ForbiddenError extends DomainError {
  public readonly code = 'FORBIDDEN' as const;

  constructor(message = 'You do not have access to this resource.', options?: { cause?: unknown }) {
    super(message, options);
  }
}

export class NotFoundError extends DomainError {
  public readonly code = 'NOT_FOUND' as const;

  constructor(message = 'We could not find what you were looking for.', options?: { cause?: unknown }) {
    super(message, options);
  }
}

export class ConflictError extends DomainError {
  public readonly code = 'CONFLICT' as const;
  public readonly meta: Readonly<Record<string, unknown>>;

  constructor(
    message = 'This action conflicts with the current state. Please review and retry.',
    meta: Record<string, unknown> = {},
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.meta = Object.freeze({ ...meta });
  }
}

export class RateLimitError extends DomainError {
  public readonly code = 'RATE_LIMITED' as const;
  public readonly retryAfterSeconds: number;

  constructor(
    message = 'Too many attempts. Please wait a moment before trying again.',
    retryAfterSeconds = 30,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class NetworkError extends DomainError {
  public readonly code = 'NETWORK' as const;

  constructor(
    message = 'We could not reach the server. Check your connection and try again.',
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

/** Keep contract diagnostics separate from the user-facing message. */
export class ContractMismatchError extends DomainError {
  public readonly code = 'CONTRACT_MISMATCH' as const;
  public readonly technicalDetail: string;

  constructor(technicalDetail: string, options?: { cause?: unknown }) {
    super('Something went wrong on our side. Please try again later.', options);
    this.technicalDetail = technicalDetail;
  }
}

export class UnexpectedError extends DomainError {
  public readonly code = 'UNEXPECTED' as const;

  constructor(
    message = 'Something went wrong. Please try again in a moment.',
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}

export function toDomainError(value: unknown): DomainError {
  if (isDomainError(value)) {
    return value;
  }
  if (value instanceof Error) {
    return new UnexpectedError(undefined, { cause: value });
  }
  return new UnexpectedError(undefined, { cause: value });
}

export function isRetryable(error: unknown): boolean {
  if (!isDomainError(error)) {
    return false;
  }
  return error.code === 'NETWORK' || error.code === 'UNEXPECTED';
}
