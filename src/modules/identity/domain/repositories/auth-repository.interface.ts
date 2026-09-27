import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type AuthSession } from '../entities/auth-session';
import { type User } from '../entities/user';
import { type Email } from '@/shared/domain/email';

export interface LoginCredentials {
  readonly email: Email;
  readonly password: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<Result<AuthSession, DomainError>>;

  /** Clear local credentials even if server revocation fails. */
  logout(): Promise<Result<void, DomainError>>;

  getCurrentUser(): Promise<Result<User, DomainError>>;
}
