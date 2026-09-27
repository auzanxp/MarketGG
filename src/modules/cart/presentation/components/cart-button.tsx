'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/shared/routes';
import { useCartStore } from '../stores/use-cart-store';
import { useCartReady } from '../hooks/use-cart-session';


export function CartButton({ className }: { className?: string }) {
  const isReady = useCartReady();
  const count = useCartStore((state) => state.cart.totalItemCount);
  const itemCount = isReady ? count : 0;

  const label =
    itemCount === 0 ? 'Cart, empty' : `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  return (
    <Link
      href={ROUTES.cart}
      aria-label={label}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className
      )}
    >
      <ShoppingCart className="size-5" aria-hidden="true" />

      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold tabular-nums text-primary-foreground"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
