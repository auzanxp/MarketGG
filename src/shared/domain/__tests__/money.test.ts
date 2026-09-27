import { describe, it, expect } from 'vitest';
import { Money } from '../money';

describe('Money Value Object', () => {
  it.each([NaN, Infinity, -Infinity])('rejects a non-finite amount (%s)', (amount) => {
    expect(() => Money.create(amount, 'USD')).toThrow();
  });
  it('should create and format USD money properly', () => {
    const price = Money.create(19.99, 'USD');
    expect(price.amount).toBe(19.99);
    expect(price.currency).toBe('USD');
    expect(price.format('en-US')).toBe('$19.99');
  });

  it('should add money of same currency', () => {
    const a = Money.create(10.5, 'USD');
    const b = Money.create(5.25, 'USD');
    const total = a.add(b);
    expect(total.amount).toBe(15.75);
  });

  it('should throw error when adding different currencies', () => {
    const usd = Money.create(10, 'USD');
    const eur = Money.create(10, 'EUR');
    expect(() => usd.add(eur)).toThrow(/Currency mismatch/);
  });

  it('should check value equality based on properties', () => {
    const m1 = Money.create(50, 'USD');
    const m2 = Money.create(50, 'USD');
    const m3 = Money.create(40, 'USD');

    expect(m1.equals(m2)).toBe(true);
    expect(m1.equals(m3)).toBe(false);
  });
});
