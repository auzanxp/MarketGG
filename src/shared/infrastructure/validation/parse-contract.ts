import type { z } from 'zod';
import { ContractMismatchError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';

interface ZodLikeIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

export function describeContractIssues(issues: readonly ZodLikeIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.map(String).join('.');
      return `${path.length > 0 ? path : '(root)'}: ${issue.message}`;
    })
    .join('; ');
}

export function parseContract<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown,
  context: string
): Result<z.output<TSchema>, ContractMismatchError> {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return Result.fail(
      new ContractMismatchError(
        `${context} returned a payload that does not match its contract — ${describeContractIssues(parsed.error.issues)}`,
        { cause: parsed.error }
      )
    );
  }

  return Result.ok(parsed.data as z.output<TSchema>);
}
