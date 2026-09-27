import { z } from 'zod';
import { PaginationMetaSchema } from '@/shared/infrastructure/http/pagination';
import { ORDER_STATUSES } from '../../domain/value-objects/order-status';
import { PAYMENT_METHODS } from '../../domain/value-objects/payment-method';
import { MAX_ORDER_QUANTITY } from '@/modules/catalog/domain/entities/product';

export const CheckoutRequestSchema = z.object({
  items: z.array(z.object({ productId: z.string().trim().min(1), quantity: z.number().int().min(1).max(MAX_ORDER_QUANTITY) })).min(1),
  billingInfo: z.object({ fullName: z.string(), email: z.string(), phone: z.string() }),
  paymentMethod: z.enum(PAYMENT_METHODS),
}).refine((value) => new Set(value.items.map((item) => item.productId)).size === value.items.length, {
  path: ['items'], message: 'Each product must appear only once.',
});

export const OrderMoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const OrderDtoSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  status: z.enum(ORDER_STATUSES),
  items: z.array(z.object({
    productId: z.string().min(1),
    sku: z.string(),
    title: z.string().min(1),
    imageUrl: z.string().url(),
    quantity: z.number().int().positive(),
    unitPrice: OrderMoneySchema,
    totalPrice: OrderMoneySchema,
  })).min(1),
  totalAmount: OrderMoneySchema,
  priceBreakdown: z.object({
    subtotal: OrderMoneySchema,
    tax: OrderMoneySchema,
    serviceFee: OrderMoneySchema,
  }),
  billingInfo: z.object({ fullName: z.string(), email: z.string(), phone: z.string() }),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const CheckoutResponseSchema = z.object({ message: z.string(), order: OrderDtoSchema });
export const OrderListResponseSchema = z.object({ items: z.array(OrderDtoSchema), meta: PaginationMetaSchema });
export type OrderDto = z.infer<typeof OrderDtoSchema>;
export type OrderListResponseDto = z.infer<typeof OrderListResponseSchema>;
export type CheckoutResponseDto = z.infer<typeof CheckoutResponseSchema>;
