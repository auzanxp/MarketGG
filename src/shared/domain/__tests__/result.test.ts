import { describe, it, expect } from 'vitest';
import { Result } from '../result';

describe('Result<T, E> Pattern', () => {
  it('should create a successful result with value', () => {
    const res = Result.ok('success_data');
    expect(res.isSuccess).toBe(true);
    expect(res.isFailure).toBe(false);
    expect(res.value).toBe('success_data');
  });

  it('should create a failure result with error', () => {
    const error = new Error('something failed');
    const res = Result.fail(error);
    expect(res.isSuccess).toBe(false);
    expect(res.isFailure).toBe(true);
    expect(res.error).toBe(error);
  });

  it('should throw when accessing value on failure', () => {
    const res = Result.fail(new Error('fail'));
    expect(() => res.value).toThrow();
  });

  it('should throw when accessing error on success', () => {
    const res = Result.ok(123);
    expect(() => res.error).toThrow();
  });

  it('should map values correctly on success', () => {
    const res = Result.ok(10);
    const mapped = res.map((v) => v * 2);
    expect(mapped.isSuccess).toBe(true);
    expect(mapped.value).toBe(20);
  });
});
