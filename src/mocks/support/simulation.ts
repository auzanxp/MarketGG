import { HttpResponse, delay } from 'msw';
import { type ProblemDetails } from '@/shared/infrastructure/http/problem-details';

// Tests skip artificial latency and control pending requests explicitly when needed.
function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test';
}

export interface LatencyRange {
  min: number;
  max: number;
}

export const DEFAULT_LATENCY: LatencyRange = { min: 200, max: 500 };

export const AUTH_LATENCY: LatencyRange = { min: 400, max: 900 };

export async function simulateLatency(range: LatencyRange = DEFAULT_LATENCY): Promise<void> {
  if (isTestEnvironment()) {
    return;
  }
  const jitter = Math.floor(Math.random() * (range.max - range.min)) + range.min;
  await delay(jitter);
}

export const PROBLEM_TYPE_BASE = 'https://vocamarket.com/errors';

export interface ProblemOptions {
  type: string;
  title: string;
  detail: string;
  errors?: Record<string, string | string[]>;
  meta?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export function problem(status: number, options: ProblemOptions): Response {
  return HttpResponse.json<ProblemDetails>(
    {
      type: `${PROBLEM_TYPE_BASE}/${options.type}`,
      title: options.title,
      status,
      detail: options.detail,
      ...(options.errors ? { errors: options.errors } : {}),
      ...(options.meta ? { meta: options.meta } : {}),
    },
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
        ...options.headers,
      },
    }
  );
}

/** API request parameter; page URLs do not forward it to queries. */
export const CHAOS_PARAM = '__chaos';

const STATUS_TITLES: Record<number, string> = {
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export function chaosResponse(request: Request) {
  const requested = new URL(request.url).searchParams.get(CHAOS_PARAM);
  if (!requested) {
    return null;
  }

  const status = Number.parseInt(requested, 10);
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    return null;
  }

  return problem(status, {
    type: 'chaos-injection',
    title: STATUS_TITLES[status] ?? 'Simulated Failure',
    detail: `Simulated ${status} failure requested via ?${CHAOS_PARAM}=${status}.`,
  });
}
