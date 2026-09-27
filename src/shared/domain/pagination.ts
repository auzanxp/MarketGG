export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 8;
export const MAX_PAGE_SIZE = 48;

export function normalisePagination(params?: PaginationParams): Required<PaginationParams> {
  const { page: requestedPage = 1, limit: requestedLimit = DEFAULT_PAGE_SIZE } = params ?? {};
  const page = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : DEFAULT_PAGE_SIZE;
  return { page: Math.max(1, page), limit: Math.min(MAX_PAGE_SIZE, Math.max(1, limit)) };
}
