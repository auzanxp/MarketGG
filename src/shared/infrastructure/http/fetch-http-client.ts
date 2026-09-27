import { type IHttpClient, type HttpRequestOptions, type HttpResponse } from './http-client.interface';
import { ApiError, ProblemDetailsSchema, type ProblemDetails } from './problem-details';
import { logApiResponse } from './api-debug';

export interface FetchHttpClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class FetchHttpClient implements IHttpClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => string | null;
  private readonly onUnauthorized?: () => void;

  constructor(options: FetchHttpClientOptions = {}) {
    const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.getAccessToken = options.getAccessToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  public async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  public async post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, body, options);
  }

  public async put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, body, options);
  }

  public async patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', url, body, options);
  }

  public async delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(endpoint, options?.params);
    const startedAt = Date.now();
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    });

    // Explicit per-request authorization takes precedence over the stored token.
    if (!headers.has('Authorization')) {
      const token = this.getAccessToken?.();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const init: RequestInit = {
      method,
      headers,
      signal: options?.signal,
    };

    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false' && process.env.NODE_ENV !== 'test') {
        const { initMsw } = await import('@/mocks/init-msw');
        await initMsw();
      }
      response = await fetch(fullUrl, init);
    } catch (networkError: unknown) {
      const problem: ProblemDetails = {
        title: 'Network Error',
        status: 0,
        detail: networkError instanceof Error ? networkError.message : 'Unable to connect to service',
      };
      logApiResponse({ source: 'http', method, endpoint: fullUrl, status: 0, durationMs: Date.now() - startedAt, data: problem });
      throw new ApiError(problem);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');

    let responseData: unknown = null;
    if (response.status !== 204) {
      if (isJson) {
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }
      } else {
        responseData = await response.text();
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        const currentToken = this.getAccessToken?.();
        const currentAuthorization = currentToken ? `Bearer ${currentToken}` : null;
        // A delayed response must not revoke a session created after this request.
        if (!this.getAccessToken || headers.get('Authorization') === currentAuthorization) {
          this.onUnauthorized?.();
        }
      }

      const parsed = ProblemDetailsSchema.safeParse(responseData);
      const problemDetails: ProblemDetails = parsed.success
        ? { ...parsed.data, status: response.status }
        : {
            title: 'HTTP Error',
            status: response.status,
            detail: 'The request could not be completed. Please try again.',
          };
      logApiResponse({ source: 'http', method, endpoint: fullUrl, status: response.status, durationMs: Date.now() - startedAt, data: problemDetails });
      throw new ApiError(problemDetails, responseData);
    }

    logApiResponse({ source: 'http', method, endpoint: fullUrl, status: response.status, durationMs: Date.now() - startedAt, data: responseData });
    return {
      data: responseData as T,
      status: response.status,
      headers: response.headers,
    };
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const isAbsolute = /^https?:\/\//i.test(endpoint);
    let base = isAbsolute ? endpoint : `${this.baseUrl}${cleanEndpoint}`;

    if (typeof window === 'undefined' && !/^https?:\/\//i.test(base)) {
      const serverOrigin = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
      base = `${serverOrigin}${base.startsWith('/') ? base : `/${base}`}`;
    }

    if (!params) {
      return base;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    if (!queryString) {
      return base;
    }

    return base.includes('?') ? `${base}&${queryString}` : `${base}?${queryString}`;
  }
}
