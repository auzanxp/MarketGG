import type { OrderStatus } from '@/modules/order/domain/value-objects/order-status';
import type { PaymentMethod } from '@/modules/order/domain/value-objects/payment-method';
import { Money } from '@/shared/domain/money';
import { PriceBreakdown, type PriceBreakdownSnapshot } from '@/shared/domain/price-breakdown';
import { INITIAL_PRODUCTS } from './seed-data';

export interface MockOrderItem {
  productId: string;
  sku: string;
  title: string;
  imageUrl: string;
  quantity: number;
  unitPrice: { amount: number; currency: string };
  totalPrice: { amount: number; currency: string };
}

export interface MockBillingInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface MockOrder {
  id: string;
  userId: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: MockOrderItem[];
  totalAmount: { amount: number; currency: string };
  priceBreakdown: PriceBreakdownSnapshot;
  paymentMethod: PaymentMethod;
  billingInfo: MockBillingInfo;
}

const BILLING: MockBillingInfo = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 234 567 8909',
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

interface OrderSeed {
  id: string;
  orderNumber: string;
  agoMs: number;
  status: OrderStatus;
  productId: string;
  sku: string;
  title: string;
  quantity: number;
  unitAmount: number;
}

// Resolve offsets on reset so seeded recent orders stay relative to the test or browser clock.
const ORDER_SEEDS: OrderSeed[] = [
  {
    id: 'ord-202600017',
    orderNumber: 'INV-202600017',
    agoMs: 2 * MINUTE,
    status: 'COMPLETED',
    productId: 'prod-1',
    sku: 'MLBB-DIAMOND-086',
    title: 'MLBB 86 Diamonds',
    quantity: 1,
    unitAmount: 1.25,
  },
  {
    id: 'ord-202600016',
    orderNumber: 'INV-202600016',
    agoMs: 15 * MINUTE,
    status: 'COMPLETED',
    productId: 'prod-10',
    sku: 'STEAM-WALLET-010',
    title: 'Steam Wallet $10',
    quantity: 1,
    unitAmount: 10.0,
  },
  {
    id: 'ord-202600015',
    orderNumber: 'INV-202600015',
    agoMs: 25 * MINUTE,
    status: 'PENDING',
    productId: 'prod-2',
    sku: 'PUBGM-UC-0060',
    title: 'PUBG UC 60',
    quantity: 1,
    unitAmount: 0.99,
  },
  {
    id: 'ord-202600014',
    orderNumber: 'INV-202600014',
    agoMs: 1 * HOUR,
    status: 'COMPLETED',
    productId: 'prod-11',
    sku: 'GPLAY-GIFT-0005',
    title: 'Google Play Gift Card $5',
    quantity: 1,
    unitAmount: 5.0,
  },
  {
    id: 'ord-202600013',
    orderNumber: 'INV-202600013',
    agoMs: 5 * HOUR,
    status: 'FAILED',
    productId: 'prod-12',
    sku: 'ITUNES-GIFT-010',
    title: 'iTunes Gift Card $10',
    quantity: 1,
    unitAmount: 10.0,
  },
  {
    id: 'ord-202600012',
    orderNumber: 'INV-202600012',
    agoMs: 2 * DAY,
    status: 'COMPLETED',
    productId: 'prod-24',
    sku: 'NFLX-1M-STD',
    title: 'Netflix 1 Month Standard',
    quantity: 1,
    unitAmount: 15.49,
  },
];

export function createInitialOrders(now: number = Date.now()): MockOrder[] {
  return ORDER_SEEDS.map((seed) => {
    const total = Math.round(seed.unitAmount * seed.quantity * 100) / 100;
    const breakdown = PriceBreakdown.fromSubtotal(Money.create(total));

    return {
      id: seed.id,
      userId: 'usr-101',
      orderNumber: seed.orderNumber,
      createdAt: new Date(now - seed.agoMs).toISOString(),
      status: seed.status,
      items: [
        {
          productId: seed.productId,
          sku: seed.sku,
          title: seed.title,
          imageUrl: INITIAL_PRODUCTS.find((product) => product.id === seed.productId)!.imageUrl,
          quantity: seed.quantity,
          unitPrice: { amount: seed.unitAmount, currency: 'USD' },
          totalPrice: { amount: total, currency: 'USD' },
        },
      ],
      totalAmount: breakdown.total.toJSON(),
      priceBreakdown: breakdown.toJSON(),
      paymentMethod: 'CARD',
      billingInfo: { ...BILLING },
    };
  });
}
