import { type DomainError, UnauthorizedError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type IHttpClient } from '@/shared/infrastructure/http/http-client.interface';
import { mapApiErrorToDomainError } from '@/shared/infrastructure/http/map-api-error';
import { type ISessionStore } from '@/shared/infrastructure/storage/session-store.interface';
import { parseContract } from '@/shared/infrastructure/validation/parse-contract';
import { AuthSession } from '../../domain/entities/auth-session';
import { type User } from '../../domain/entities/user';
import {
  type IAuthRepository,
  type LoginCredentials,
} from '../../domain/repositories/auth-repository.interface';
import { mapUserDtoToDomain } from '../mappers/user.mapper';
import { LoginResponseSchema, UserDtoSchema } from '../schemas/auth.schema';

export class HttpAuthRepository implements IAuthRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly sessionStore: ISessionStore
  ) {}

  public async login(credentials: LoginCredentials): Promise<Result<AuthSession, DomainError>> {
    try {
      const response = await this.http.post<unknown>('/auth/login', {
        email: credentials.email.value,
        password: credentials.password,
      });

      const contract = parseContract(LoginResponseSchema, response.data, 'POST /auth/login');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      const { user: userDto, tokens } = contract.value;

      const userResult = mapUserDtoToDomain(userDto, 'POST /auth/login');
      if (userResult.isFailure) {
        return Result.fail(userResult.error);
      }

      // Convert the API lifetime in seconds to an absolute expiry.
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      const session = AuthSession.create({
        user: userResult.value,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      });

      this.sessionStore.write({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: expiresAt.getTime(),
      });

      return Result.ok(session);
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }

  public async logout(): Promise<Result<void, DomainError>> {
    try {
      await this.http.post<unknown>('/auth/logout');
    } catch (error: unknown) {
      // Server revocation is best-effort; finally still clears the local session when offline.
      console.warn('[auth] Server-side session revoke failed; cleared locally anyway.', error);
    } finally {
      this.sessionStore.clear();
    }

    return Result.ok(undefined);
  }

  public async getCurrentUser(): Promise<Result<User, DomainError>> {
    if (!this.sessionStore.read()) {
      return Result.fail(new UnauthorizedError('You are not signed in.'));
    }

    try {
      const response = await this.http.get<unknown>('/auth/me');

      const contract = parseContract(UserDtoSchema, response.data, 'GET /auth/me');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      return mapUserDtoToDomain(contract.value, 'GET /auth/me');
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }
}
