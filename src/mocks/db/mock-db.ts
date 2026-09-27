import {
  CATALOG_STATS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  type RawCategory,
  type RawProduct,
} from './seed-data';
import { createInitialOrders, type MockOrder } from './seed-orders';
import { INITIAL_USERS, type MockUser } from './seed-users';
import { z } from 'zod';
import { ConflictError, ValidationError } from '@/shared/domain/errors';
import { Money } from '@/shared/domain/money';
import { PriceBreakdown } from '@/shared/domain/price-breakdown';
import { BillingInfo } from '@/modules/order/domain/value-objects/billing-info';
import { isPaymentMethod } from '@/modules/order/domain/value-objects/payment-method';
import { type CheckoutInput, type OrderFilters } from '@/modules/order/domain/repositories/order-repository.interface';
import { normalisePagination, type PaginatedResult, type PaginationParams } from '@/shared/domain/pagination';
import { MAX_ORDER_QUANTITY } from '@/modules/catalog/domain/entities/product';
import { OrderDtoSchema } from '@/modules/order/infrastructure/schemas/order.schema';
import { mapOrderDtoToDomain } from '@/modules/order/infrastructure/mappers/order.mapper';

export const MOCK_STORAGE_KEY = 'vocamarket:mock:v1';
const UserIdSchema = z.string().refine((id) => INITIAL_USERS.some((user) => user.id === id));
const MockSnapshotSchema = z.object({
  version: z.literal(1),
  stocks: z.record(z.string(), z.number().int().nonnegative()),
  orders: z.array(OrderDtoSchema.extend({ userId: UserIdSchema })),
  accessTokens: z.array(z.tuple([z.string(), z.object({ userId: UserIdSchema, expiresAt: z.number() })])),
  loginAttempts: z.array(z.tuple([z.string(), z.object({ failures: z.number().int().nonnegative(), blockedUntil: z.number() })])),
  tokenCounter: z.number().int().nonnegative(),
});

export type { MockOrder, MockOrderItem, MockBillingInfo } from './seed-orders';

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

export const MAX_LOGIN_ATTEMPTS = 5;

export const LOGIN_BLOCK_SECONDS = 30;

export const RECENT_ORDERS_LIMIT = 4;

interface IssuedToken {
  userId: string;
  expiresAt: number;
}

interface LoginAttemptRecord {
  failures: number;
  /** Epoch milliseconds; zero means not blocked. */
  blockedUntil: number;
}

export interface IssuedTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginThrottleState {
  isBlocked: boolean;
  retryAfterSeconds: number;
}

export type ProductSortKey = 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export interface ProductQuery {
  query?: string;
  category?: string;
  publisher?: string;
  sortBy?: ProductSortKey;
  page?: number;
  limit?: number;
}

export type PaginatedProductResult = PaginatedResult<RawProduct>;

function paginate<T>(items: T[], params?: PaginationParams): PaginatedResult<T> {
  const normalised = normalisePagination(params);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / normalised.limit));
  const page = Math.min(normalised.page, totalPages);
  const offset = (page - 1) * normalised.limit;
  return { items: structuredClone(items.slice(offset, offset + normalised.limit)), total, page, limit: normalised.limit, totalPages };
}

export interface DashboardSummaryPayload {
  stats: {
    products: { value: number; deltaPercent: number };
    ordersToday: { value: number; deltaPercent: number };
    revenueToday: { value: { amount: number; currency: string }; deltaPercent: number };
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    productSummary: string;
    amount: { amount: number; currency: string };
    status: MockOrder['status'];
    placedAt: string;
  }>;
}

export class MockDatabase {
  private products: RawProduct[] = [];
  private categories: RawCategory[] = [];
  private orders: MockOrder[] = [];
  private users: MockUser[] = [];
  private accessTokens = new Map<string, IssuedToken>();
  private loginAttempts = new Map<string, LoginAttemptRecord>();
  private tokenCounter = 0;
  private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = null;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.storage = null;
    this.products = structuredClone(INITIAL_PRODUCTS);
    this.categories = structuredClone(INITIAL_CATEGORIES);
    this.users = structuredClone(INITIAL_USERS);
    this.orders = createInitialOrders();
    this.accessTokens.clear();
    this.loginAttempts.clear();
    this.tokenCounter = 0;
  }

  // Browser persistence is opt-in; SSR and tests keep independent databases.
  public enablePersistence(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): string | null {
    this.storage = storage;
    try {
      const raw = storage.getItem(MOCK_STORAGE_KEY);
      if (!raw) return null;
      const snapshot = MockSnapshotSchema.parse(JSON.parse(raw));
      if (snapshot.orders.some((order) => mapOrderDtoToDomain(order, 'mock storage').isFailure)) {
        throw new Error('Invalid stored receipt');
      }
      this.products = this.products.map((product) => ({ ...product, stock: snapshot.stocks[product.id] ?? product.stock }));
      this.orders = snapshot.orders;
      this.accessTokens = new Map(snapshot.accessTokens);
      this.loginAttempts = new Map(snapshot.loginAttempts);
      this.tokenCounter = snapshot.tokenCounter;
      return null;
    } catch {
      this.reset();
      this.storage = storage;
      try { storage.removeItem(MOCK_STORAGE_KEY); } catch { this.storage = null; }
      return 'Saved demo data could not be restored. The demo has been reset.';
    }
  }

  private save(): void {
    if (!this.storage) return;
    try {
      // Single-tab snapshot; cross-tab transactions require a backend.
      this.storage.setItem(MOCK_STORAGE_KEY, JSON.stringify({
        version: 1,
        stocks: Object.fromEntries(this.products.map((product) => [product.id, product.stock])),
        orders: this.orders,
        accessTokens: [...this.accessTokens],
        loginAttempts: [...this.loginAttempts],
        tokenCounter: this.tokenCounter,
      }));
    } catch {
      this.storage = null;
      console.warn('[MSW] Browser storage unavailable. Demo data will last until refresh.');
    }
  }

  private static normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  public findUserByEmail(email: string): MockUser | undefined {
    const normalised = MockDatabase.normaliseEmail(email);
    return this.users.find((user) => user.email.toLowerCase() === normalised);
  }

  public verifyCredentials(email: string, password: string): MockUser | undefined {
    const user = this.findUserByEmail(email);
    return user && user.password === password ? user : undefined;
  }

  public issueTokens(userId: string): IssuedTokenPair {
    this.tokenCounter += 1;
    const unique = `${Date.now().toString(36)}-${this.tokenCounter}`;
    const accessToken = `mock-access-${userId}-${unique}`;

    this.accessTokens.set(accessToken, {
      userId,
      expiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    this.save();

    return {
      accessToken,
      refreshToken: `mock-refresh-${userId}-${unique}`,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  public findUserByAccessToken(accessToken: string): MockUser | undefined {
    const issued = this.accessTokens.get(accessToken);
    if (!issued) {
      return undefined;
    }
    if (issued.expiresAt <= Date.now()) {
      this.accessTokens.delete(accessToken);
      this.save();
      return undefined;
    }
    return this.users.find((user) => user.id === issued.userId);
  }

  public revokeAccessToken(accessToken: string): void {
    this.accessTokens.delete(accessToken);
    this.save();
  }

  public getLoginThrottle(email: string): LoginThrottleState {
    const record = this.loginAttempts.get(MockDatabase.normaliseEmail(email));
    if (!record || record.blockedUntil <= Date.now()) {
      return { isBlocked: false, retryAfterSeconds: 0 };
    }
    return {
      isBlocked: true,
      retryAfterSeconds: Math.ceil((record.blockedUntil - Date.now()) / 1000),
    };
  }

  public registerFailedLogin(email: string): LoginThrottleState {
    const key = MockDatabase.normaliseEmail(email);
    const record = this.loginAttempts.get(key) ?? { failures: 0, blockedUntil: 0 };

    record.failures += 1;
    if (record.failures >= MAX_LOGIN_ATTEMPTS) {
      record.blockedUntil = Date.now() + LOGIN_BLOCK_SECONDS * 1000;
      record.failures = 0;
    }
    this.loginAttempts.set(key, record);
    this.save();

    return this.getLoginThrottle(email);
  }

  public clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(MockDatabase.normaliseEmail(email));
    this.save();
  }

  public getCategories(): RawCategory[] {
    return structuredClone(this.categories);
  }

  public getPublishers(): string[] {
    return Array.from(new Set(this.products.map((product) => product.publisher))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private resolveCategoryName(slug: string): string | undefined {
    const normalised = slug.trim().toLowerCase();
    const match = this.categories.find(
      (category) =>
        category.slug.toLowerCase() === normalised ||
        category.name.toLowerCase() === normalised
    );
    return match?.name;
  }

  public getProducts(params?: ProductQuery): PaginatedProductResult {
    let result = [...this.products];

    if (params?.query) {
      const needle = params.query.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(needle) ||
          product.publisher.toLowerCase().includes(needle) ||
          product.description.toLowerCase().includes(needle) ||
          product.sku.toLowerCase().includes(needle)
      );
    }

    if (params?.category) {
      const categoryName = this.resolveCategoryName(params.category);
      result = categoryName
        ? result.filter((product) => product.category === categoryName)
        : [];
    }

    if (params?.publisher) {
      const needle = params.publisher.trim().toLowerCase();
      result = result.filter((product) => product.publisher.toLowerCase() === needle);
    }

    result = MockDatabase.sortProducts(result, params?.sortBy ?? 'popular');

    return paginate(result, params);
  }

  private static sortProducts(products: RawProduct[], sortBy: ProductSortKey): RawProduct[] {
    const sorted = [...products];

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price.amount - b.price.amount);
      case 'price_desc':
        return sorted.sort((a, b) => b.price.amount - a.price.amount);
      case 'rating':
        // Break ties consistently so products do not move between pages across requests.
        return sorted.sort((a, b) => b.rating - a.rating || b.soldCount - a.soldCount);
      case 'newest':
        return sorted.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
      case 'popular':
      default:
        return sorted.sort((a, b) => b.soldCount - a.soldCount || a.id.localeCompare(b.id));
    }
  }

  public getProductById(id: string): RawProduct | undefined {
    const found = this.products.find((product) => product.id === id);
    return found ? structuredClone(found) : undefined;
  }

  public getProductBySku(sku: string): RawProduct | undefined {
    const found = this.products.find((product) => product.sku === sku);
    return found ? structuredClone(found) : undefined;
  }

  public checkStockConflict(
    items: Array<{ productId: string; quantity: number }>
  ): { hasConflict: boolean; conflictingProduct?: RawProduct; requestedQty?: number } {
    for (const item of items) {
      const product = this.products.find((candidate) => candidate.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return {
          hasConflict: true,
          conflictingProduct: product ? structuredClone(product) : undefined,
          requestedQty: item.quantity,
        };
      }
    }
    return { hasConflict: false };
  }

  public decrementStock(productId: string, quantity: number): boolean {
    const product = this.products.find((candidate) => candidate.id === productId);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !product || product.stock < quantity) {
      return false;
    }
    product.stock -= quantity;
    this.save();
    return true;
  }

  public createOrder(data: CheckoutInput & { userId: string }): MockOrder {
    const billing = BillingInfo.create(data.billingInfo);
    if (billing.isFailure) throw billing.error;
    if (!this.users.some((user) => user.id === data.userId) || !isPaymentMethod(data.paymentMethod)) {
      throw new ValidationError('Choose a valid account and payment method.');
    }
    if (!data.items.length || data.items.some((item) => !item.productId.trim() ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ORDER_QUANTITY) ||
        new Set(data.items.map((item) => item.productId)).size !== data.items.length) {
      throw new ValidationError('Please review the items in your cart.', { items: 'Invalid cart items.' });
    }
    const conflict = this.checkStockConflict([...data.items]);
    if (conflict.hasConflict) {
      throw new ConflictError('One or more items are no longer available in the requested quantity.', {
        productId: conflict.conflictingProduct?.id,
        availableStock: conflict.conflictingProduct?.stock ?? 0,
        requestedQuantity: conflict.requestedQty,
      });
    }
    const orderItems: MockOrder['items'] = [];
    let totalCents = 0;

    for (const item of data.items) {
      const product = this.products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const lineTotal = Math.round(product.price.amount * item.quantity * 100) / 100;
      totalCents += Math.round(lineTotal * 100);

      orderItems.push({
        productId: product.id,
        sku: product.sku,
        title: product.title,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        unitPrice: { ...product.price },
        totalPrice: { amount: lineTotal, currency: product.price.currency },
      });
    }

    const sequence = 202600018 + this.orders.length;
    const breakdown = PriceBreakdown.fromSubtotal(Money.create(totalCents / 100));
    const order: MockOrder = {
      id: `ord-${sequence}`,
      userId: data.userId,
      orderNumber: `INV-${sequence}`,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
      items: orderItems,
      totalAmount: breakdown.total.toJSON(),
      priceBreakdown: breakdown.toJSON(),
      paymentMethod: data.paymentMethod,
      billingInfo: { fullName: billing.value.fullName, email: billing.value.email.value, phone: billing.value.phone },
    };

    // Validate all items before committing stock changes; no awaits inside this transaction.
    for (const item of data.items) {
      this.products.find((product) => product.id === item.productId)!.stock -= item.quantity;
    }
    this.orders.unshift(order);
    this.save();
    return structuredClone(order);
  }

  public getOrders(filter?: { status?: MockOrder['status']; query?: string; userId?: string }): MockOrder[] {
    let result = [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id.localeCompare(a.id)
    );

    if (filter?.userId) result = result.filter((order) => order.userId === filter.userId);
    if (filter?.status) {
      result = result.filter((order) => order.status === filter.status);
    }

    if (filter?.query) {
      const needle = filter.query.toLowerCase().trim();
      result = result.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(needle) ||
          order.items.some((item) => item.title.toLowerCase().includes(needle))
      );
    }

    return structuredClone(result);
  }

  public getOrdersPage(filter?: OrderFilters & { userId?: string }): PaginatedResult<MockOrder> {
    return paginate(this.getOrders(filter), filter);
  }

  public getOrderById(id: string, userId?: string): MockOrder | undefined {
    const found = this.orders.find((order) => order.id === id && (!userId || order.userId === userId));
    return found ? structuredClone(found) : undefined;
  }

  private static summariseItems(order: MockOrder): string {
    const [first, ...rest] = order.items;
    if (!first) {
      return '—';
    }
    return rest.length === 0 ? first.title : `${first.title} (+${rest.length} more)`;
  }

  // Recent orders reflect the current database; headline metrics are seeded aggregates.
  public getDashboardSummary(userId?: string): DashboardSummaryPayload {
    const recentOrders = this.getOrders({ userId })
      .slice(0, RECENT_ORDERS_LIMIT)
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        productSummary: MockDatabase.summariseItems(order),
        amount: { ...order.totalAmount },
        status: order.status,
        placedAt: order.createdAt,
      }));

    return {
      stats: {
        products: {
          value: CATALOG_STATS.totalProducts,
          deltaPercent: CATALOG_STATS.productsDeltaPercent,
        },
        ordersToday: {
          value: CATALOG_STATS.ordersToday,
          deltaPercent: CATALOG_STATS.ordersDeltaPercent,
        },
        revenueToday: {
          value: {
            amount: CATALOG_STATS.revenueTodayAmount,
            currency: CATALOG_STATS.currency,
          },
          deltaPercent: CATALOG_STATS.revenueDeltaPercent,
        },
      },
      recentOrders,
    };
  }
}

export const mockDb = new MockDatabase();
