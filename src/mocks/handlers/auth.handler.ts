import { http, HttpResponse } from 'msw';
import { LoginRequestSchema, type LoginResponseDto, type UserDto } from '@/modules/identity/infrastructure/schemas/auth.schema';
import { mockDb } from '../db/mock-db';
import { toPublicUser } from '../db/seed-users';
import { AUTH_LATENCY, chaosResponse, problem, simulateLatency } from '../support/simulation';

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function throttleResponse(retryAfterSeconds: number) {
  return problem(429, {
    type: 'too-many-attempts',
    title: 'Too Many Attempts',
    detail: `Too many failed sign-in attempts. Try again in ${retryAfterSeconds} seconds.`,
    meta: { retryAfterSeconds },
    headers: { 'Retry-After': String(retryAfterSeconds) },
  });
}

export const authHandlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency(AUTH_LATENCY);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problem(400, {
        type: 'malformed-body',
        title: 'Invalid Request Body',
        detail: 'Request body must be valid JSON.',
      });
    }

    const payload = LoginRequestSchema.safeParse(body);
    if (!payload.success) {
      const errors: Record<string, string> = {};
      for (const issue of payload.error.issues) {
        const key = String(issue.path[0] ?? 'body');
        errors[key] ??= issue.message;
      }
      return problem(422, {
        type: 'validation',
        title: 'Validation Failed',
        detail: 'Please check the highlighted fields and try again.',
        errors,
      });
    }
    const { email, password } = payload.data;

    // A throttled account stays blocked even when given valid credentials.
    const existingThrottle = mockDb.getLoginThrottle(email);
    if (existingThrottle.isBlocked) {
      return throttleResponse(existingThrottle.retryAfterSeconds);
    }

    const user = mockDb.verifyCredentials(email, password);

    if (!user) {
      const throttle = mockDb.registerFailedLogin(email);
      if (throttle.isBlocked) {
        return throttleResponse(throttle.retryAfterSeconds);
      }
      // Use the same response for unknown accounts and incorrect passwords.
      return problem(401, {
        type: 'invalid-credentials',
        title: 'Invalid Credentials',
        detail: 'The email or password you entered is incorrect.',
      });
    }

    mockDb.clearLoginAttempts(email);

    return HttpResponse.json<LoginResponseDto>({
      user: toPublicUser(user),
      tokens: mockDb.issueTokens(user.id),
    });
  }),

  http.get('*/api/v1/auth/me', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency({ min: 120, max: 320 });

    const token = readBearerToken(request);
    if (!token) {
      return problem(401, {
        type: 'unauthorized',
        title: 'Unauthorized',
        detail: 'Missing or malformed Authorization header.',
      });
    }

    const user = mockDb.findUserByAccessToken(token);
    if (!user) {
      return problem(401, {
        type: 'session-expired',
        title: 'Session Expired',
        detail: 'Your session has expired. Please sign in again.',
      });
    }

    return HttpResponse.json<UserDto>(toPublicUser(user));
  }),

  http.post('*/api/v1/auth/logout', async ({ request }) => {
    await simulateLatency({ min: 100, max: 250 });

    const token = readBearerToken(request);
    if (token) {
      mockDb.revokeAccessToken(token);
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
