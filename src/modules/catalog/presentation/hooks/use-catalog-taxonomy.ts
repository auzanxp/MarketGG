'use client';

import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { useUseCaseQuery } from '@/shared/presentation/hooks/use-use-case-query';
import { type GetCategoriesUseCase } from '../../application/use-cases/get-categories.usecase';
import { type GetPublishersUseCase } from '../../application/use-cases/get-publishers.usecase';
import { CATEGORIES_QUERY_KEY, PUBLISHERS_QUERY_KEY } from '../lib/catalog-search-params';

const TAXONOMY_STALE_TIME = 1000 * 60 * 30;

export function useCategories() {
  return useUseCaseQuery<GetCategoriesUseCase>(
    TOKENS.GetCategoriesUseCase,
    CATEGORIES_QUERY_KEY,
    undefined,
    { staleTime: TAXONOMY_STALE_TIME }
  );
}

export function usePublishers() {
  return useUseCaseQuery<GetPublishersUseCase>(
    TOKENS.GetPublishersUseCase,
    PUBLISHERS_QUERY_KEY,
    undefined,
    { staleTime: TAXONOMY_STALE_TIME }
  );
}
