import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type GetProductDetailUseCase } from '@/modules/catalog/application/use-cases/get-product-detail.usecase';
import { ProductDetailView } from '@/modules/catalog/presentation/components/product-detail-view';
import { getContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { getQueryClient } from '@/shared/infrastructure/query/get-query-client';

export const metadata: Metadata = {
  title: 'Product',
  description: 'Product details, pricing, and availability.',
};

interface ProductDetailPageProps {
  params: Promise<{ sku: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { sku } = await params;
  const getProductDetail = getContainer().resolve<GetProductDetailUseCase>(
    TOKENS.GetProductDetailUseCase
  );
  const result = await getProductDetail.execute(sku);

  if (result.isFailure) {
    if (result.error.code === 'NOT_FOUND') notFound();
    return <ProductDetailView sku={sku} />;
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData(['product', sku], result.value.toJSON());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailView sku={sku} />
    </HydrationBoundary>
  );
}
