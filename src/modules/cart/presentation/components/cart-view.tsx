'use client';

import * as React from 'react';
import Image from 'next/image';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ButtonLink } from '@/components/atoms';
import {
  EmptyState,
  PageHeader,
  PriceSummary,
  QuantityStepper,
  type PriceSummaryRow,
} from '@/components/molecules';
import { DataTable, type DataTableColumn } from '@/components/organisms';
import { Button } from '@/components/ui/button';
import { ROUTE_BUILDERS, ROUTES } from '@/shared/routes';
import { type CartItem } from '../../domain/entities/cart-item';
import { useCartStore } from '../stores/use-cart-store';
import { useCartReady } from '../hooks/use-cart-session';
import { Skeleton } from '@/components/ui/skeleton';


function CartLineCell({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={item.imageUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="44px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          <ButtonLink
            href={ROUTE_BUILDERS.productDetail(item.sku)}
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm font-medium text-foreground"
          >
            {item.title}
          </ButtonLink>
        </p>
        <p className="truncate text-xs text-muted-foreground">{item.publisher}</p>
      </div>
    </div>
  );
}

export function CartView() {
  const isReady = useCartReady();
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const breakdown = cart.priceBreakdown;

  const handleRemove = (item: CartItem) => {
    const ownerId = useCartStore.getState().userId;
    removeItem(item.productId);
    toast.success(`${item.title} removed`, {
      action: {
        label: 'Undo',
        onClick: () =>
          useCartStore.setState((state) => state.userId === ownerId ? { cart: state.cart.addItem(item) } : state),
      },
    });
  };


  const columns: ReadonlyArray<DataTableColumn<CartItem>> = [
    {
      id: 'product',
      header: 'Product',
      cell: (item) => <CartLineCell item={item} />,
      className: 'min-w-[12rem]',
    },
    {
      id: 'price',
      header: 'Price',
      cell: (item) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {item.unitPrice.format()}
        </span>
      ),
      hideBelow: 'sm',
    },
    {
      id: 'quantity',
      header: 'Quantity',
      cell: (item) => (
        <QuantityStepper
          size="sm"
          value={item.quantity}
          onValueChange={(next) => updateQuantity(item.productId, next)}
          min={1}
          max={item.maxQuantity}
          label={`Quantity for ${item.title}`}
        />
      ),
    },
    {
      id: 'total',
      header: 'Total',
      align: 'end',
      cell: (item) => (
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {item.totalPrice.format()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'end',
      cell: (item) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => handleRemove(item)}
          aria-label={`Remove ${item.title} from cart`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      ),
    },
  ];

  const summaryRows: readonly PriceSummaryRow[] = [
    { id: 'subtotal', label: 'Subtotal', value: breakdown.subtotal.format() },
    { id: 'tax', label: breakdown.taxLabel, value: breakdown.tax.format() },
    { id: 'fee', label: 'Service Fee', value: breakdown.serviceFee.format() },
  ];

  if (!isReady) return <Skeleton className="h-72 w-full rounded-2xl" />;
  if (cart.isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader title="Shopping Cart" />
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Browse the marketplace and add a top-up, gift card, or subscription to get started."
          action={<ButtonLink href={ROUTES.marketplace}>Browse marketplace</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopping Cart"
        description={`${cart.totalItemCount} ${cart.totalItemCount === 1 ? 'item' : 'items'} ready for checkout`}
      />

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <DataTable
          caption="Items in your shopping cart"
          columns={columns}
          rows={cart.items}
          getRowId={(item) => item.productId}
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <ButtonLink href={ROUTES.marketplace} variant="outline" size="lg" className="lg:mt-2">
          Continue Shopping
        </ButtonLink>

        <div className="w-full rounded-2xl border border-border bg-card p-5 lg:max-w-sm">
          <PriceSummary
            rows={summaryRows}
            total={{ label: 'Total', value: breakdown.total.format() }}
          />
          <ButtonLink href={ROUTES.checkout} size="xl" className="mt-5 w-full font-semibold">
            Checkout
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
