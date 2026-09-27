import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type GetProductsUseCase } from '@/modules/catalog/application/use-cases/get-products.usecase';
import { MarketplaceView } from '@/modules/catalog/presentation/components/marketplace-view';
import {
  loadCatalogSearchParams,
  productsQueryKey,
  toProductFilters,
} from '@/modules/catalog/presentation/lib/catalog-search-params';
import { getContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { getQueryClient } from '@/shared/infrastructure/query/get-query-client';

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Browse games, mobile top-ups, gift cards, and entertainment products.',
};

interface MarketplacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Serialize domain entities before crossing the RSC boundary; the client rebuilds them in select.
export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await loadCatalogSearchParams(searchParams);
  const filters = toProductFilters(params);

  const queryClient = getQueryClient();
  const getProductsUseCase = getContainer().resolve<GetProductsUseCase>(
    TOKENS.GetProductsUseCase
  );

  await queryClient.prefetchQuery({
    queryKey: productsQueryKey(filters),
    queryFn: async () => {
      const result = await getProductsUseCase.execute(filters);
      if (result.isFailure) {
        throw result.error;
      }
      return result.value;
    },
  });

  const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

  return (
    <HydrationBoundary state={dehydratedState}>
      <MarketplaceView />
    </HydrationBoundary>
  );
}
