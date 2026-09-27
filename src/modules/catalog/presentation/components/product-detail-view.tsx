'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, PackageSearch, RotateCcw, ShieldCheck, ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { ButtonLink, Rating, StatusPill } from '@/components/atoms';
import {
  AlertBanner,
  Breadcrumbs,
  EmptyState,
  FeatureHighlight,
  ImageGallery,
  QuantityStepper,
  type GalleryImage,
} from '@/components/molecules';
import { TwoColumnTemplate } from '@/components/templates';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/shared/routes';
import { useCartStore } from '@/modules/cart/presentation/stores/use-cart-store';
import { useCartReady } from '@/modules/cart/presentation/hooks/use-cart-session';

import { type Product } from '../../domain/entities/product';
import { useProductDetail } from '../hooks/use-product-detail';


const TRUST_SIGNALS = [
  { icon: <Zap />, title: 'Instant Delivery', description: '1-5 minutes', tone: 'primary' },
  { icon: <ShieldCheck />, title: 'Secure Payment', description: '100% protected', tone: 'success' },
  { icon: <Headphones />, title: '24/7 Support', description: 'Always here', tone: 'info' },
] as const;

const countFormatter = new Intl.NumberFormat('en-US');

function StockSignal({ product }: { product: Product }) {
  if (product.isOutOfStock) {
    return (
      <StatusPill tone="danger" withDot>
        Sold out
      </StatusPill>
    );
  }
  if (product.isLowStock) {
    return (
      <StatusPill tone="warning" withDot>
        Only {product.stock} left
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="success" withDot>
      In stock
    </StatusPill>
  );
}

function toGalleryImages(product: Product): GalleryImage[] {
  return [{ src: product.imageUrl, alt: '' }];
}

interface ProductDetailContentProps {
  product: Product;
}

function ProductDetailContent({ product }: ProductDetailContentProps) {
  const router = useRouter();
  const isCartReady = useCartReady();
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = React.useState(1);

  const maxQuantity = product.maxOrderQuantity;
  const isPurchasable = isCartReady && !product.isOutOfStock;

  const addToCart = () => {
    const before = useCartStore.getState().cart.totalItemCount;
    addItem(product, quantity);
    return useCartStore.getState().cart.totalItemCount - before;
  };

  const handleAddToCart = () => {
    const added = addToCart();
    if (!added) {
      toast.info('This item is already at the maximum quantity in your cart.');
      return;
    }
    toast.success(`${product.title} added to cart`, {
      description: `Quantity: ${added}`,
      action: { label: 'View cart', onClick: () => router.push(ROUTES.cart) },
    });
  };

  const handleBuyNow = () => {
    addToCart();
    router.push(ROUTES.checkout);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: ROUTES.marketplace },
          { label: product.publisher },
          { label: product.title },
        ]}
      />

      <TwoColumnTemplate
        ratio="equal"
        primary={
          <ImageGallery
            images={toGalleryImages(product)}
            overlay={<StockSignal product={product} />}
          />
        }
        secondary={
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {product.title}
              </h1>
              <p className="text-sm text-muted-foreground">{product.publisher}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              <Rating value={product.rating} />
              {product.soldCount > 0 && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>{countFormatter.format(product.soldCount)} sold</span>
                </>
              )}
            </div>

            <p className="font-heading text-3xl font-bold tracking-tight">
              {product.price.format()}
            </p>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                Stock: <span className="font-medium text-foreground">{countFormatter.format(product.stock)}</span>
              </span>
              <StockSignal product={product} />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-foreground">Quantity</p>
              <QuantityStepper
                value={quantity}
                onValueChange={setQuantity}
                min={1}
                max={Math.max(1, maxQuantity)}
                disabled={!isPurchasable}
                hint={isPurchasable ? `Max. ${maxQuantity}` : 'Unavailable'}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={handleAddToCart}
                disabled={!isPurchasable}
                className="font-semibold bg-white border-primary text-primary"
              >
                <ShoppingCart aria-hidden="true" />
                Add to Cart
              </Button>
              <Button
                type="button"
                size="xl"
                onClick={handleBuyNow}
                disabled={!isPurchasable}
                className="font-semibold"
              >
                Buy Now
              </Button>
            </div>

            <ul className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
              {TRUST_SIGNALS.map((signal) => (
                <li key={signal.title}>
                  <FeatureHighlight
                    icon={signal.icon}
                    title={signal.title}
                    description={signal.description}
                    tone={signal.tone}
                  />
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <TwoColumnTemplate
        ratio="equal"
        primary={<Skeleton className="aspect-square w-full rounded-2xl" />}
        secondary={
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
            </div>
            <Skeleton className="h-11 w-44" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        }
      />
    </div>
  );
}

export interface ProductDetailViewProps {
  sku: string;
}

export function ProductDetailView({ sku }: ProductDetailViewProps) {
  const { data: product, isPending, isError, error, refetch } = useProductDetail(sku);

  if (isPending) {
    return <ProductDetailSkeleton />;
  }

  if (isError && error.code === 'NOT_FOUND') {
    return (
      <EmptyState
        icon={<PackageSearch />}
        title="This product is no longer available"
        description="It may have been delisted, or the link could be out of date."
        action={
          <ButtonLink href={ROUTES.marketplace} variant="outline">
            Back to marketplace
          </ButtonLink>
        }
      />
    );
  }

  if (isError) {
    return (
      <AlertBanner tone="error" title="Could not load this product">
        <p>{error.message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          className="mt-2"
        >
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </AlertBanner>
    );
  }

  if (!product) {
    return null;
  }

  return <ProductDetailContent product={product} />;
}
