import { describe, expect, it } from 'vitest';
import { type DomainError, UnauthorizedError, ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { AuthSession } from '../../domain/entities/auth-session';
import { User } from '../../domain/entities/user';
import {
  type IAuthRepository,
  type LoginCredentials,
} from '../../domain/repositories/auth-repository.interface';
import { Email } from '@/shared/domain/email';
import { LoginUseCase } from '../use-cases/login.usecase';

const user = User.create({
  id: 'usr-101',
  email: Email.create('john.doe@example.com').value,
  name: 'John Doe',
  plan: 'PREMIUM',
});

const session = AuthSession.create({
  user,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 3600_000),
});

class FakeAuthRepository implements IAuthRepository {
  public calls: LoginCredentials[] = [];

  constructor(private readonly loginResult: Result<AuthSession, DomainError> = Result.ok(session)) {}

  public async login(credentials: LoginCredentials): Promise<Result<AuthSession, DomainError>> {
    this.calls.push(credentials);
    return this.loginResult;
  }

  public async logout(): Promise<Result<void, DomainError>> {
    return Result.ok(undefined);
  }

  public async getCurrentUser(): Promise<Result<User, DomainError>> {
    return Result.ok(user);
  }
}

describe('LoginUseCase', () => {
  it('returns the session on success', async () => {
    const repo = new FakeAuthRepository();

    const result = await new LoginUseCase(repo).execute({
      email: 'john.doe@example.com',
      password: 'password123',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.accessToken).toBe('access-token');
  });

  it('hands the repository a normalised Email value object', async () => {
    const repo = new FakeAuthRepository();

    await new LoginUseCase(repo).execute({
      email: '  John.Doe@EXAMPLE.com ',
      password: 'password123',
    });

    expect(repo.calls).toHaveLength(1);
    expect(repo.calls[0].email).toBeInstanceOf(Email);
    expect(repo.calls[0].email.value).toBe('john.doe@example.com');
    // Preserve password whitespace; it may be part of the credential.
    expect(repo.calls[0].password).toBe('password123');
  });

  describe('validation', () => {
    it('reports every problem at once instead of one at a time', async () => {
      const repo = new FakeAuthRepository();

      const result = await new LoginUseCase(repo).execute({ email: '', password: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect((result.error as ValidationError).fieldErrors).toEqual({
        email: 'Email is required.',
        password: 'Password is required.',
      });
    });

    it('flags only the malformed field', async () => {
      const result = await new LoginUseCase(new FakeAuthRepository()).execute({
        email: 'nope',
        password: 'password123',
      });

      expect((result.error as ValidationError).fieldErrors).toEqual({
        email: 'Enter a valid email address.',
      });
    });

    it('does not reach the network when input is invalid', async () => {
      const repo = new FakeAuthRepository();

      await new LoginUseCase(repo).execute({ email: 'nope', password: '' });

      expect(repo.calls).toHaveLength(0);
    });

    it('accepts a short password — length rules belong to sign-up, not sign-in', async () => {
      const repo = new FakeAuthRepository();

      const result = await new LoginUseCase(repo).execute({
        email: 'john.doe@example.com',
        password: 'a',
      });

      expect(result.isSuccess).toBe(true);
      expect(repo.calls).toHaveLength(1);
    });

    it('survives a missing input object without throwing', async () => {
      const result = await new LoginUseCase(new FakeAuthRepository()).execute(
        undefined as unknown as { email: string; password: string }
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });

  it('passes a repository failure through untouched', async () => {
    const rejection = new UnauthorizedError('The email or password you entered is incorrect.');
    const repo = new FakeAuthRepository(Result.fail(rejection));

    const result = await new LoginUseCase(repo).execute({
      email: 'john.doe@example.com',
      password: 'wrong',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(rejection);
  });
});
