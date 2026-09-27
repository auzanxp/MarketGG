export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, error?: E, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  public get value(): T {
    if (this.isFailure) {
      throw new Error(`Cannot retrieve value from a failed Result: ${String(this._error)}`);
    }
    return this._value as T;
  }

  public get error(): E {
    if (this.isSuccess) {
      throw new Error('Cannot retrieve error from a successful Result');
    }
    return this._error as E;
  }

  public static ok<U>(value: U): Result<U, never> {
    return new Result<U, never>(true, undefined, value);
  }

  public static fail<F>(error: F): Result<never, F> {
    return new Result<never, F>(false, error, undefined);
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<E>(this._error as E);
    }
    return Result.ok<U>(fn(this.value));
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<E>(this._error as E);
    }
    return fn(this.value);
  }
}
