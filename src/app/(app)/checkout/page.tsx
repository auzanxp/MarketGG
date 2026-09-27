import type { Metadata } from 'next';
import { CheckoutView } from '@/modules/order/presentation/components/checkout-view';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Confirm your billing details and complete your purchase.',
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
