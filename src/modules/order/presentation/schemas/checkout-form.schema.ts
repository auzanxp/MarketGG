import { z } from 'zod';
import { Email } from '@/shared/domain/email';
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '../../domain/value-objects/payment-method';

const PHONE_SHAPE = /^[+]?[\d\s()-]{7,}$/;
const MIN_PHONE_DIGITS = 7;

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter the name on the account.')
    .max(120, 'That name is too long.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .refine((value) => Email.create(value).isSuccess, {
      message: 'Enter a valid email address.',
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine(
      (value) =>
        PHONE_SHAPE.test(value) && value.replace(/\D/g, '').length >= MIN_PHONE_DIGITS,
      { message: 'Enter a phone number we can reach you on.' }
    ),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;

export const CHECKOUT_FORM_INITIAL_VALUES: CheckoutFormValues = {
  fullName: '',
  email: '',
  phone: '',
  paymentMethod: DEFAULT_PAYMENT_METHOD,
};
