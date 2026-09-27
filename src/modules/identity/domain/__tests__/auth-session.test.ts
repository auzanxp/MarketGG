import { describe, expect, it } from 'vitest';
import { AuthSession } from '../entities/auth-session';
import { User } from '../entities/user';
import { Email } from '@/shared/domain/email';

const user = User.create({
  id: 'usr-101',
  email: Email.create('john.doe@example.com').value,
  name: 'John Doe',
  plan: 'PREMIUM',
});

function makeSession(expiresInSeconds: number, now = Date.now()) {
  return AuthSession.create({
    user,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(now + expiresInSeconds * 1000),
  });
}

describe('AuthSession', () => {
  it('rejects a session with no access token', () => {
    expect(() =>
      AuthSession.create({
        user,
        accessToken: '   ',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 1000),
      })
    ).toThrow(/access token/i);
  });

  it('rejects an unparseable expiry', () => {
    expect(() =>
      AuthSession.create({
        user,
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date('not a date'),
      })
    ).toThrow(/valid expiry/i);
  });

  describe('expiry', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    it('is not expired before the deadline', () => {
      const session = makeSession(3600, now.getTime());

      expect(session.isExpired(now)).toBe(false);
      expect(session.secondsUntilExpiry(now)).toBe(3600);
    });

    it('is expired exactly at the deadline, not merely after it', () => {
      const session = makeSession(0, now.getTime());

      expect(session.isExpired(now)).toBe(true);
    });

    it('never reports negative time remaining', () => {
      const session = makeSession(-500, now.getTime());

      expect(session.secondsUntilExpiry(now)).toBe(0);
    });
  });

  describe('needsRefresh', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    it('is false while comfortably in the future', () => {
      expect(makeSession(3600, now.getTime()).needsRefresh(60, now)).toBe(false);
    });

    it('turns true once inside the threshold, before the token actually dies', () => {
      const session = makeSession(30, now.getTime());

      expect(session.isExpired(now)).toBe(false);
      expect(session.needsRefresh(60, now)).toBe(true);
    });
  });

  it('carries the user through', () => {
    expect(makeSession(3600).user.email.value).toBe('john.doe@example.com');
  });
});
