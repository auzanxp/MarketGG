'use client';

import { useQuery } from '@tanstack/react-query';
import { type DomainError } from '@/shared/domain/errors';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { useDI } from '@/shared/presentation/use-di';
import { type GetProductsUseCase } from '../../application/use-cases/get-products.usecase';
import { Product } from '../../domain/entities/product';
import {
  type PaginatedProducts,
  type ProductFilters,
} from '../../domain/repositories/product-repository.interface';
import { productsQueryKey } from '../lib/catalog-search-params';

export function useProducts(filters: ProductFilters) {
  const getProductsUseCase = useDI<GetProductsUseCase>(TOKENS.GetProductsUseCase);

  return useQuery<PaginatedProducts, DomainError, PaginatedProducts>({
    queryKey: productsQueryKey(filters),
    refetchOnMount: process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false' ? 'always' : true,
    queryFn: async () => {
      const result = await getProductsUseCase.execute(filters);
      if (result.isFailure) {
        throw result.error;
      }
      return result.value;
    },
    select: (data) => ({
      ...data,
      items: data.items.map((item) => Product.fromJSON(item)),
    }),
    placeholderData: (previous) => previous,
  });
}
