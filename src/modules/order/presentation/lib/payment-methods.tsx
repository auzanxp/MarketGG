import * as React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import type { OptionCardItem } from '@/components/molecules';
import { type PaymentMethod } from '../../domain/value-objects/payment-method';


const ACCEPTED_CARDS = ['VISA', 'MC', 'AMEX'] as const;

function AcceptedCards() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1">
      {ACCEPTED_CARDS.map((brand) => (
        <span
          key={brand}
          className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.5625rem] font-bold tracking-wide text-muted-foreground"
        >
          {brand}
        </span>
      ))}
    </span>
  );
}

const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; description: string; icon: React.ReactNode; trailing?: React.ReactNode }
> = {
  CARD: {
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, and American Express',
    icon: <CreditCard />,
    trailing: <AcceptedCards />,
  },
  EWALLET: {
    label: 'E-Wallet',
    description: 'Pay from your linked wallet balance',
    icon: <Wallet />,
  },
  PAYPAL: {
    label: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: <Wallet />,
  },
};

export const PAYMENT_METHOD_OPTIONS: ReadonlyArray<OptionCardItem<PaymentMethod>> = (
  Object.keys(PAYMENT_METHOD_META) as PaymentMethod[]
).map((value) => ({ value, ...PAYMENT_METHOD_META[value] }));

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_META[method].label;
}
