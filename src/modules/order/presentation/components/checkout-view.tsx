'use client';

import * as React from 'react';
import { Lock, ShoppingBag } from 'lucide-react';

import { ButtonLink } from '@/components/atoms';
import {
  EmptyState,
  AlertBanner,
  FormField,
  OptionCardGroup,
  PageHeader,
} from '@/components/molecules';
import { TwoColumnTemplate } from '@/components/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/shared/routes';
import { useZodForm } from '@/shared/presentation/hooks/use-zod-form';
import { useCartStore } from '@/modules/cart/presentation/stores/use-cart-store';
import { useSession } from '@/modules/identity/presentation/hooks/use-session';
import { useCartReady } from '@/modules/cart/presentation/hooks/use-cart-session';
import { ConflictError, ValidationError } from '@/shared/domain/errors';
import { useCheckout } from '../hooks/use-orders';

import { type User } from '@/modules/identity/domain/entities/user';
import { Skeleton } from '@/components/ui/skeleton';

import { type PaymentMethod } from '../../domain/value-objects/payment-method';
import { PAYMENT_METHOD_OPTIONS } from '../lib/payment-methods';
import {
  CHECKOUT_FORM_INITIAL_VALUES,
  checkoutFormSchema,
  type CheckoutFormValues,
} from '../schemas/checkout-form.schema';
import { OrderSummaryCard, type OrderSummaryLine } from './order-summary-card';


function initialValuesFor(user: User | null): CheckoutFormValues {
  if (!user) {
    return CHECKOUT_FORM_INITIAL_VALUES;
  }
  return {
    ...CHECKOUT_FORM_INITIAL_VALUES,
    fullName: user.name,
    email: user.email.value,
  };
}

function CheckoutForm({ user }: { user: User | null }) {
  const checkout = useCheckout();
  const cart = useCartStore((state) => state.cart);
  const breakdown = cart.priceBreakdown;

  const form = useZodForm({
    schema: checkoutFormSchema,
    initialValues: initialValuesFor(user),
    onSubmit: async (values) => {
      try {
        await checkout.mutateAsync({
          items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          billingInfo: { fullName: values.fullName, email: values.email, phone: values.phone },
          paymentMethod: values.paymentMethod,
        });
      } catch (error) {
        if (error instanceof ValidationError) form.setFieldErrors(error.fieldErrors);
      }
    },
  });
  const isBusy = form.isSubmitting || checkout.isPending || checkout.isSuccess;
  const conflict = checkout.error instanceof ConflictError ? checkout.error : null;

  const fullName = form.fieldProps('fullName');
  const email = form.fieldProps('email');
  const phone = form.fieldProps('phone');

  const summaryLines: readonly OrderSummaryLine[] = cart.items.map((item) => ({
    id: item.productId,
    title: item.title,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    totalPriceLabel: item.totalPrice.format(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Checkout" description="Confirm your details and complete the purchase." />

      {checkout.error && (
        <AlertBanner tone="error" title={conflict ? 'Please review your cart' : 'Could not complete your purchase'}>
          <p>{checkout.error.message}</p>
          {conflict && (
            <>
              <p>Available stock: {String(conflict.meta.availableStock ?? 0)}. Your cart has been kept.</p>
              <ButtonLink href={ROUTES.cart} variant="outline" size="sm" className="mt-2">Review cart</ButtonLink>
            </>
          )}
        </AlertBanner>
      )}

      <form onSubmit={form.handleSubmit} noValidate>
        <TwoColumnTemplate
          ratio="wide-primary"
          stickySecondary
          primary={
            <div className="flex flex-col gap-6">
              <fieldset className="rounded-2xl border border-border bg-card p-5">
                <legend className="mb-4 text-sm font-semibold text-foreground">
                  Billing Information
                </legend>

                <div className="flex flex-col gap-4">
                  <FormField
                    label="Full Name"
                    htmlFor={fullName.id}
                    messageId={fullName['aria-describedby']}
                    error={form.errors.fullName}
                  >
                    <Input
                      {...fullName}
                      size="lg"
                      placeholder="John Doe"
                      autoComplete="name"
                      disabled={isBusy}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    htmlFor={email.id}
                    messageId={email['aria-describedby']}
                    error={form.errors.email}
                  >
                    <Input
                      {...email}
                      type="email"
                      size="lg"
                      placeholder="john.doe@email.com"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      disabled={isBusy}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Phone Number"
                    htmlFor={phone.id}
                    messageId={phone['aria-describedby']}
                    error={form.errors.phone}
                    hint="We only use this if there is a problem with your order."
                  >
                    <Input
                      {...phone}
                      type="tel"
                      size="lg"
                      placeholder="+1 234 567 8900"
                      autoComplete="tel"
                      inputMode="tel"
                      disabled={isBusy}
                      required
                    />
                  </FormField>
                </div>
              </fieldset>

              <div className="rounded-2xl border border-border bg-card p-5">
                <OptionCardGroup<PaymentMethod>
                  label="Payment Method"
                  value={form.values.paymentMethod}
                  onValueChange={(next) => form.setValue('paymentMethod', next)}
                  options={PAYMENT_METHOD_OPTIONS}
                  disabled={isBusy}
                />
              </div>
            </div>
          }
          secondary={
            <OrderSummaryCard
              lines={summaryLines}
              breakdown={breakdown}
              footer={
                <div className="space-y-3">
                  <Button
                    type="submit"
                    size="xl"
                    disabled={isBusy}
                    className="w-full font-semibold cursor-pointer"
                  >
                    <Lock aria-hidden="true" />
                    {isBusy ? 'Processing…' : 'Complete Purchase'}
                  </Button>

                  <p className="text-center text-[0.6875rem] leading-relaxed text-muted-foreground">
                    By continuing, you agree to our{' '}
                    <span className="font-medium text-primary">Terms of Service</span> and{' '}
                    <span className="font-medium text-primary">Privacy Policy</span>.
                  </p>
                </div>
              }
            />
          }
        />
      </form>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <TwoColumnTemplate
        ratio="wide-primary"
        primary={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        }
        secondary={<Skeleton className="h-80 w-full rounded-2xl" />}
      />
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div className="space-y-6">
      <PageHeader title="Checkout" />
      <EmptyState
        icon={<ShoppingBag />}
        title="There is nothing to check out"
        description="Your cart is empty. Add an item and the checkout will be waiting."
        action={<ButtonLink href={ROUTES.marketplace}>Browse marketplace</ButtonLink>}
      />
    </div>
  );
}

export function CheckoutView() {
  const isReady = useCartReady();
  const isCartEmpty = useCartStore((state) => state.cart.isEmpty);
  const { user, isLoading } = useSession();

  if (isLoading || !isReady) {
    return <CheckoutSkeleton />;
  }

  if (isCartEmpty) return <EmptyCheckout />;

  return <CheckoutForm user={user} />;
}
