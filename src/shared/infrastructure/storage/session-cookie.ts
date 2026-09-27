// Mock auth needs a JavaScript-readable cookie. A production session requires a backend-issued HttpOnly cookie.

export const SESSION_COOKIE_NAME = 'vm_session';

export interface StoredSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Epoch milliseconds. */
  readonly expiresAt: number;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.expiresAt === 'number' &&
    Number.isFinite(candidate.expiresAt)
  );
}

export function encodeSession(session: StoredSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeSession(raw: string | null | undefined): StoredSession | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(session: StoredSession, now: number = Date.now()): boolean {
  return session.expiresAt <= now;
}

export function readSessionFromCookieString(cookieString: string | null | undefined): StoredSession | null {
  if (!cookieString) {
    return null;
  }
  for (const part of cookieString.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    if (part.slice(0, separatorIndex).trim() === SESSION_COOKIE_NAME) {
      return decodeSession(part.slice(separatorIndex + 1).trim());
    }
  }
  return null;
}
