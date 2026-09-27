import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/shared/domain/errors';
import { Email } from '@/shared/domain/email';

describe('Email', () => {
  describe('normalisation', () => {
    it('trims surrounding whitespace and lowercases', () => {
      const result = Email.create('  John.Doe@Example.COM  ');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('john.doe@example.com');
    });

    it('makes differently-cased inputs structurally equal', () => {
      const a = Email.create('JOHN@example.com').value;
      const b = Email.create('john@example.com').value;

      expect(a.equals(b)).toBe(true);
    });
  });

  describe('rejection', () => {
    it('fails rather than throws, so a form can render the message', () => {
      const result = Email.create('not-an-email');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.fieldErrors.email).toBe('Enter a valid email address.');
    });

    it('reports an empty or whitespace-only value as missing, not malformed', () => {
      for (const input of ['', '   ']) {
        const result = Email.create(input);
        expect(result.isFailure).toBe(true);
        expect(result.error.fieldErrors.email).toBe('Email is required.');
      }
    });

    it.each([
      'missing-at.example.com',
      '@example.com',
      'john@',
      'john@example',
      'john doe@example.com',
      'john@@example.com',
    ])('rejects %s', (input) => {
      expect(Email.create(input).isFailure).toBe(true);
    });

    it('rejects addresses beyond the 254-octet limit from RFC 5321', () => {
      const tooLong = `${'a'.repeat(250)}@example.com`;

      const result = Email.create(tooLong);

      expect(result.isFailure).toBe(true);
      expect(result.error.fieldErrors.email).toBe('That email address is too long.');
    });
  });

  describe('acceptance', () => {
    it.each([
      'john@example.com',
      'john.doe+tag@sub.example.co.uk',
      'j@a.io',
      "o'brien@example.com",
    ])('accepts %s', (input) => {
      expect(Email.create(input).isSuccess).toBe(true);
    });
  });

  it('exposes the domain part', () => {
    expect(Email.create('john@sub.example.com').value.domain).toBe('sub.example.com');
  });

  it('stringifies to its normalised value', () => {
    expect(String(Email.create(' JOHN@EXAMPLE.COM ').value)).toBe('john@example.com');
  });
});
