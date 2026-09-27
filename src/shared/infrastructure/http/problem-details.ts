import { z } from 'zod';

export const ProblemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  detail: z.string(),
  instance: z.string().optional(),
  errors: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export class ApiError extends Error {
  public readonly status: number;
  public readonly type?: string;
  public readonly detail: string;
  public readonly errors?: Record<string, string[] | string>;
  public readonly meta?: Record<string, unknown>;
  public readonly raw?: unknown;

  constructor(problem: ProblemDetails, raw?: unknown) {
    super(problem.detail || problem.title || `API Error with status ${problem.status}`);
    this.name = 'ApiError';
    this.status = problem.status;
    this.type = problem.type;
    this.detail = problem.detail || problem.title;
    this.errors = problem.errors;
    this.meta = problem.meta;
    this.raw = raw;
  }

  public isConflict(): boolean {
    return this.status === 409;
  }

  public isUnauthorized(): boolean {
    return this.status === 401;
  }

  public isNotFound(): boolean {
    return this.status === 404;
  }

  public isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  public isServerError(): boolean {
    return this.status >= 500;
  }
}
