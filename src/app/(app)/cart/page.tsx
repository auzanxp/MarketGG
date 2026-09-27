import type { Metadata } from 'next';
import { CartView } from '@/modules/cart/presentation/components/cart-view';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review the items in your cart before checking out.',
};

export default function CartPage() {
  return <CartView />;
}
