import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Rating, StatusPill } from '@/components/atoms';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { type Product } from '../../domain/entities/product';

export interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  href?: string;
  className?: string;
}

function StockBadge({ product }: { product: Product }) {
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
  return null;
}

export function ProductCard({ product, layout = 'grid', href, className }: ProductCardProps) {
  const isList = layout === 'list';

  return (
    <article
      aria-label={product.title}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40',
        'focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/50',
        isList ? 'flex items-center gap-4 p-3' : 'flex flex-col',
        className
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-muted',
          isList ? 'size-20 rounded-xl' : 'aspect-square w-full'
        )}
      >
        <Image
          src={product.imageUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes={isList ? '80px' : '(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw'}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        {!isList && (
          <div className="absolute top-2.5 left-2.5">
            <StockBadge product={product} />
          </div>
        )}
      </div>

      <div className={cn('min-w-0 flex-1', isList ? '' : 'p-3.5')}>
        <h3 className="truncate text-sm font-semibold text-foreground">
          {href ? (
            <Link href={href} className="outline-none">
              {product.title}
              <span aria-hidden="true" className="absolute inset-0 z-0" />
            </Link>
          ) : (
            product.title
          )}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{product.publisher}</p>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading text-base font-bold tracking-tight text-foreground">
              {product.price.format()}
            </p>
            <p className="text-[0.6875rem] text-muted-foreground">
              Stock: {new Intl.NumberFormat('en-US').format(product.stock)}
            </p>
          </div>
          <Rating value={product.rating} className="shrink-0 pb-0.5" />
        </div>

        {isList && (
          <div className="mt-2">
            <StockBadge product={product} />
          </div>
        )}
      </div>
    </article>
  );
}

function ProductCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  const isList = layout === 'list';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card',
        isList ? 'flex items-center gap-4 p-3' : 'flex flex-col'
      )}
    >
      <Skeleton className={cn(isList ? 'size-20 rounded-xl' : 'aspect-square w-full rounded-none')} />
      <div className={cn('w-full min-w-0 flex-1 space-y-2', isList ? '' : 'p-3.5')}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-end justify-between pt-1.5">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-2.5 w-14" />
          </div>
          <Skeleton className="h-3.5 w-10" />
        </div>
      </div>
    </div>
  );
}

ProductCard.Skeleton = ProductCardSkeleton;
