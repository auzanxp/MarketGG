import { type StoredSession } from './session-cookie';

export interface ISessionStore {
  /** Null when absent, malformed or expired. */
  read(): StoredSession | null;
  write(session: StoredSession): void;
  clear(): void;
  getAccessToken(): string | null;
}
