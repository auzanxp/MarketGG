import { beforeEach, describe, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { server } from '../server';
import {
  RateLimitError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from '@/shared/domain/errors';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { FetchHttpClient } from '@/shared/infrastructure/http/fetch-http-client';
import { mapApiErrorToDomainError } from '@/shared/infrastructure/http/map-api-error';
import { ApiError } from '@/shared/infrastructure/http/problem-details';
import { type ISessionStore } from '@/shared/infrastructure/storage/session-store.interface';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { type LogoutUseCase } from '@/modules/identity/application/use-cases/logout.usecase';
import { type GetCurrentUserUseCase } from '@/modules/identity/application/use-cases/get-current-user.usecase';
import { MAX_LOGIN_ATTEMPTS } from '../db/mock-db';

describe('Authentication flow (real DI graph + MSW)', () => {
  const VALID = { email: 'john.doe@example.com', password: 'password123' };

  let login: LoginUseCase;
  let logout: LogoutUseCase;
  let getCurrentUser: GetCurrentUserUseCase;
  let sessionStore: ISessionStore;

  beforeEach(() => {
    const container = createContainer();
    login = container.resolve<LoginUseCase>(TOKENS.LoginUseCase);
    logout = container.resolve<LogoutUseCase>(TOKENS.LogoutUseCase);
    getCurrentUser = container.resolve<GetCurrentUserUseCase>(TOKENS.GetCurrentUserUseCase);
    sessionStore = container.resolve<ISessionStore>(TOKENS.SessionStore);
  });

  describe('successful sign-in', () => {
    it('returns a domain session built from the wire payload', async () => {
      const result = await login.execute(VALID);

      expect(result.isSuccess).toBe(true);

      const session = result.value;
      expect(session.user.name).toBe('John Doe');
      expect(session.user.email.value).toBe(VALID.email);
      expect(session.user.isPremium).toBe(true);
      expect(session.user.initials).toBe('JD');
      expect(session.accessToken).toBeTruthy();
      expect(session.isExpired()).toBe(false);
    });

    it('persists the tokens so the next page load is already authenticated', async () => {
      expect(sessionStore.read()).toBeNull();

      const session = (await login.execute(VALID)).value;

      expect(sessionStore.getAccessToken()).toBe(session.accessToken);
    });

    it('never leaks the password back to the client', async () => {
      const session = (await login.execute(VALID)).value;

      expect(JSON.stringify(session.user)).not.toContain(VALID.password);
    });

    it('converts the relative expiresIn into an absolute expiry', async () => {
      const session = (await login.execute(VALID)).value;

      expect(session.secondsUntilExpiry()).toBeGreaterThan(3500);
      expect(session.secondsUntilExpiry()).toBeLessThanOrEqual(3600);
    });
  });

  describe('rejected credentials', () => {
    it('maps 401 to UnauthorizedError with the server copy', async () => {
      const result = await login.execute({ ...VALID, password: 'definitely-wrong' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error.message).toBe('The email or password you entered is incorrect.');
    });

    it('gives the same answer for an unknown email, so accounts cannot be enumerated', async () => {
      const unknown = await login.execute({
        email: 'nobody@example.com',
        password: 'password123',
      });
      const wrongPassword = await login.execute({ ...VALID, password: 'wrong' });

      expect(unknown.error.message).toBe(wrongPassword.error.message);
      expect(unknown.error.code).toBe(wrongPassword.error.code);
    });

    it('stores nothing after a failed attempt', async () => {
      await login.execute({ ...VALID, password: 'wrong' });

      expect(sessionStore.read()).toBeNull();
    });
  });

  describe('server-side validation', () => {
    it('surfaces a 422 as field errors the form can bind', async () => {
      const http = new FetchHttpClient({ baseUrl: 'http://localhost:3000/api/v1' });

      await expect(
        http.post('/auth/login', { email: 'not-an-email', password: '' })
      ).rejects.toBeInstanceOf(ApiError);

      const error = await http
        .post('/auth/login', { email: 'not-an-email', password: '' })
        .then(() => null)
        .catch((caught: unknown) => mapApiErrorToDomainError(caught));

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toMatchObject({
        email: 'Enter a valid email address.',
        password: 'Password is required.',
      });
    });

    it('rejects a malformed JSON body with 400', async () => {
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json at all',
      });

      expect(response.status).toBe(400);
    });

    it.each([null, [], 'text', 123, { email: 123, password: false }])(
      'rejects an invalid JSON payload (%j) with 422',
      async (payload) => {
        const response = await fetch('http://localhost:3000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(response.status).toBe(422);
        expect(await response.json()).toMatchObject({ status: 422, errors: expect.any(Object) });
      }
    );
  });

  describe('failure injection', () => {
    it('honours ?__chaos=<status> so error states can be demoed and tested', async () => {
      const http = new FetchHttpClient({ baseUrl: 'http://localhost:3000/api/v1' });

      const error = await http
        .post('/auth/login?__chaos=503', VALID)
        .then(() => null)
        .catch((caught: unknown) => mapApiErrorToDomainError(caught));

      expect(error).toBeInstanceOf(UnexpectedError);
      expect(error?.message).not.toContain('503');
    });
  });

  describe('brute-force throttling', () => {
    it(`switches to 429 after ${MAX_LOGIN_ATTEMPTS} failures and reports the wait`, async () => {
      for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS - 1; attempt += 1) {
        const result = await login.execute({ ...VALID, password: 'wrong' });
        expect(result.error).toBeInstanceOf(UnauthorizedError);
      }

      const throttled = await login.execute({ ...VALID, password: 'wrong' });

      expect(throttled.error).toBeInstanceOf(RateLimitError);
      expect((throttled.error as RateLimitError).retryAfterSeconds).toBeGreaterThan(0);
    });

    it('stays throttled even when the correct password finally arrives', async () => {
      for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt += 1) {
        await login.execute({ ...VALID, password: 'wrong' });
      }

      const result = await login.execute(VALID);

      expect(result.error).toBeInstanceOf(RateLimitError);
    });

    it('resets the counter after a successful sign-in', async () => {
      await login.execute({ ...VALID, password: 'wrong' });
      await login.execute({ ...VALID, password: 'wrong' });
      expect((await login.execute(VALID)).isSuccess).toBe(true);

      const result = await login.execute({ ...VALID, password: 'wrong' });
      expect(result.error).toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('current user', () => {
    it('keeps the new account signed in when an old request finishes with 401', async () => {
      await login.execute(VALID);
      let release!: () => void;
      let requested!: () => void;
      const pending = new Promise<void>((resolve) => { release = resolve; });
      const started = new Promise<void>((resolve) => { requested = resolve; });
      server.use(http.get('*/api/v1/dashboard/summary', async () => {
        requested();
        await pending;
        return HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 });
      }));
      const client = new FetchHttpClient({
        baseUrl: 'http://localhost:3000/api/v1',
        getAccessToken: () => sessionStore.getAccessToken(),
        onUnauthorized: () => sessionStore.clear(),
      });
      const failedRequest = client.get('/dashboard/summary').catch((error: unknown) => error);
      await started;
      const jane = (await login.execute({ email: 'jane.smith@example.com', password: 'password123' })).value;
      release();

      expect(await failedRequest).toBeInstanceOf(ApiError);
      expect(sessionStore.getAccessToken()).toBe(jane.accessToken);
      expect((await getCurrentUser.execute()).value.id).toBe('usr-102');
    });

    it('fails fast without a stored token, skipping a guaranteed 401', async () => {
      const result = await getCurrentUser.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error.message).toBe('You are not signed in.');
    });

    it('resolves the profile using the bearer token attached by the HTTP client', async () => {
      await login.execute(VALID);

      const result = await getCurrentUser.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('usr-101');
      expect(result.value.firstName).toBe('John');
    });
  });

  describe('sign-out', () => {
    it('clears the local session', async () => {
      await login.execute(VALID);
      expect(sessionStore.read()).not.toBeNull();

      const result = await logout.execute();

      expect(result.isSuccess).toBe(true);
      expect(sessionStore.read()).toBeNull();
    });

    it('revokes the token server-side, so a replay is rejected', async () => {
      const session = (await login.execute(VALID)).value;
      await logout.execute();

      sessionStore.write({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt.getTime(),
      });

      const result = await getCurrentUser.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(sessionStore.read()).toBeNull();
    });

    it('is idempotent', async () => {
      await login.execute(VALID);

      expect((await logout.execute()).isSuccess).toBe(true);
      expect((await logout.execute()).isSuccess).toBe(true);
    });
  });
});
