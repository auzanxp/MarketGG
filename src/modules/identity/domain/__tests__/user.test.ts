import { describe, expect, it } from 'vitest';
import { User } from '../entities/user';
import { Email } from '@/shared/domain/email';

function makeUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  return User.create({
    id: 'usr-101',
    email: Email.create('john.doe@example.com').value,
    name: 'John Doe',
    plan: 'PREMIUM',
    ...overrides,
  });
}

describe('User', () => {
  it('throws on broken invariants, because a User is only built from validated data', () => {
    expect(() => makeUser({ id: '   ' })).toThrow(/id cannot be empty/i);
    expect(() => makeUser({ name: '  ' })).toThrow(/name cannot be empty/i);
  });

  it('trims the stored name', () => {
    expect(makeUser({ name: '  John Doe  ' }).name).toBe('John Doe');
  });

  it('compares by identity, not by attributes', () => {
    const a = makeUser();
    const b = makeUser({ name: 'Renamed Person', plan: 'FREE' });

    expect(a.equals(b)).toBe(true);
    expect(a.equals(makeUser({ id: 'usr-999' }))).toBe(false);
  });

  describe('plan', () => {
    it('derives isPremium from the tier', () => {
      expect(makeUser({ plan: 'PREMIUM' }).isPremium).toBe(true);
      expect(makeUser({ plan: 'FREE' }).isPremium).toBe(false);
    });
  });

  describe('display helpers', () => {
    it('extracts a first name for greetings', () => {
      expect(makeUser({ name: 'John Doe' }).firstName).toBe('John');
      expect(makeUser({ name: 'Cher' }).firstName).toBe('Cher');
    });

    it('builds avatar initials from the first and last name', () => {
      expect(makeUser({ name: 'John Doe' }).initials).toBe('JD');
      expect(makeUser({ name: 'Ada Byron Lovelace' }).initials).toBe('AL');
    });

    it('falls back to two letters for a single-word name', () => {
      expect(makeUser({ name: 'Cher' }).initials).toBe('CH');
    });
  });
});
