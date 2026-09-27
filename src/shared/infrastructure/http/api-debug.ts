interface ApiDebugEntry {
  source: 'http' | 'local-mock';
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  data: unknown;
}

const SENSITIVE_KEYS = new Set(['password', 'accesstoken', 'refreshtoken', 'authorization', 'cookie', 'set-cookie', 'fullname', 'email', 'phone']);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redact(item),
  ]));
}

export function logApiResponse(entry: ApiDebugEntry): void {
  const flag = process.env.NEXT_PUBLIC_API_DEBUG;
  if (flag === 'false' || (flag !== 'true' && process.env.NODE_ENV !== 'development')) return;
  const runtime = typeof window === 'undefined' ? 'server' : 'client';
  const snapshot = redact(entry);
  // eslint-disable-next-line no-console -- Payload logging is explicitly enabled for API debugging.
  console.log(`[API][${runtime}][${entry.source}]`, runtime === 'server' ? JSON.stringify(snapshot, null, 2) : snapshot);
}
