import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { normalisePagination } from '@/shared/domain/pagination';
import {
  type IProductRepository,
  type PaginatedProducts,
  type ProductFilters,
} from '../../domain/repositories/product-repository.interface';

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/shared/domain/pagination';

const NO_FILTER_VALUES = new Set(['', 'all']);

function normaliseFilterValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return NO_FILTER_VALUES.has(trimmed.toLowerCase()) ? undefined : trimmed;
}

export class GetProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  public async execute(filters?: ProductFilters): Promise<Result<PaginatedProducts, DomainError>> {
    const sanitised: ProductFilters = {
      query: filters?.query?.trim() || undefined,
      category: normaliseFilterValue(filters?.category),
      publisher: normaliseFilterValue(filters?.publisher),
      sortBy: filters?.sortBy ?? 'popular',
      ...normalisePagination(filters),
    };

    return this.productRepo.getProducts(sanitised);
  }
}
