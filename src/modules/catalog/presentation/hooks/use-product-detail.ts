'use client';

import { useUseCaseQuery } from '@/shared/presentation/hooks/use-use-case-query';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type GetProductDetailUseCase } from '../../application/use-cases/get-product-detail.usecase';
import { Product } from '../../domain/entities/product';

export function useProductDetail(sku: string) {
  return useUseCaseQuery<GetProductDetailUseCase>(
    TOKENS.GetProductDetailUseCase,
    ['product', sku],
    sku,
    {
      enabled: Boolean(sku),
      refetchOnMount: process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false' ? 'always' : true,
      select: (data) => Product.fromJSON(data),
    }
  );
}
