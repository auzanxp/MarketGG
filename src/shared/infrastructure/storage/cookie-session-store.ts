import { type ISessionStore } from './session-store.interface';
import {
  SESSION_COOKIE_NAME,
  type StoredSession,
  encodeSession,
  isSessionExpired,
  readSessionFromCookieString,
} from './session-cookie';

// The cookie lets the route proxy check navigation before client hydration.
export class CookieSessionStore implements ISessionStore {
  private readonly cookieName: string;

  constructor(cookieName: string = SESSION_COOKIE_NAME) {
    this.cookieName = cookieName;
  }

  public read(): StoredSession | null {
    if (typeof document === 'undefined') {
      return null;
    }
    const session = readSessionFromCookieString(document.cookie);
    if (!session) {
      return null;
    }
    if (isSessionExpired(session)) {
      this.clear();
      return null;
    }
    return session;
  }

  public write(session: StoredSession): void {
    if (typeof document === 'undefined') {
      return;
    }
    const maxAgeSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
    document.cookie = [
      `${this.cookieName}=${encodeSession(session)}`,
      'Path=/',
      `Max-Age=${maxAgeSeconds}`,
      'SameSite=Lax',
      ...(typeof location !== 'undefined' && location.protocol === 'https:' ? ['Secure'] : []),
    ].join('; ');
  }

  public clear(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.cookie = `${this.cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  public getAccessToken(): string | null {
    return this.read()?.accessToken ?? null;
  }
}

export class InMemorySessionStore implements ISessionStore {
  private session: StoredSession | null = null;

  public read(): StoredSession | null {
    if (this.session && isSessionExpired(this.session)) {
      this.session = null;
    }
    return this.session;
  }

  public write(session: StoredSession): void {
    this.session = session;
  }

  public clear(): void {
    this.session = null;
  }

  public getAccessToken(): string | null {
    return this.read()?.accessToken ?? null;
  }
}
