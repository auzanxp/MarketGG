import { z } from 'zod';
import { type PaginatedResult } from '@/shared/domain/pagination';

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().positive(),
});

export interface PaginatedResponse<T> {
  items: T[];
  meta: z.infer<typeof PaginationMetaSchema>;
}

export function toPaginatedResponse<T>({ items, ...meta }: PaginatedResult<T>): PaginatedResponse<T> {
  return { items, meta };
}
