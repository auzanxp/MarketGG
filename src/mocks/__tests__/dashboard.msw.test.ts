import { beforeEach, describe, expect, it } from 'vitest';
import { UnauthorizedError } from '@/shared/domain/errors';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type GetDashboardSummaryUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-summary.usecase';
import { type LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { RECENT_ORDERS_LIMIT } from '../db/mock-db';

describe('Dashboard summary (real DI graph + MSW)', () => {
  const CREDENTIALS = { email: 'john.doe@example.com', password: 'password123' };

  let login: LoginUseCase;
  let getSummary: GetDashboardSummaryUseCase;

  beforeEach(() => {
    const container = createContainer();
    login = container.resolve<LoginUseCase>(TOKENS.LoginUseCase);
    getSummary = container.resolve<GetDashboardSummaryUseCase>(TOKENS.GetDashboardSummaryUseCase);
  });

  describe('authorisation', () => {
    it('refuses an unauthenticated request', async () => {
      const result = await getSummary.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
    });

    it('succeeds once a session exists, with no explicit token plumbing', async () => {
      await login.execute(CREDENTIALS);

      const result = await getSummary.execute();

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('stats', () => {
    beforeEach(async () => {
      await login.execute(CREDENTIALS);
    });

    it('maps the figures from the design', async () => {
      const { stats } = (await getSummary.execute()).value;

      expect(stats.totalProducts).toBe(1245);
      expect(stats.ordersToday).toBe(328);
      expect(stats.revenueToday.format()).toBe('$18,245.00');
    });

    it('builds MetricDelta value objects, not bare numbers', async () => {
      const { stats } = (await getSummary.execute()).value;

      expect(stats.productsDelta.format()).toBe('+12%');
      expect(stats.ordersDelta.format()).toBe('+8.2%');
      expect(stats.revenueDelta.format()).toBe('+15.3%');
      expect(stats.revenueDelta.direction).toBe('up');
      expect(stats.revenueDelta.isFavourable).toBe(true);
    });
  });

  describe('recent orders', () => {
    beforeEach(async () => {
      await login.execute(CREDENTIALS);
    });

    it('returns the newest orders, capped and in order', async () => {
      const summary = (await getSummary.execute()).value;

      expect(summary.hasRecentOrders).toBe(true);
      expect(summary.recentOrders).toHaveLength(RECENT_ORDERS_LIMIT);

      const timestamps = summary.recentOrders.map((order) => order.placedAt.getTime());
      expect([...timestamps].sort((a, b) => b - a)).toEqual(timestamps);
    });

    it('reproduces the rows in the design', async () => {
      const { recentOrders } = (await getSummary.execute()).value;

      expect(recentOrders.map((order) => order.orderNumber)).toEqual([
        'INV-202600017',
        'INV-202600016',
        'INV-202600015',
        'INV-202600014',
      ]);
      expect(recentOrders[0].productSummary).toBe('MLBB 86 Diamonds');
      expect(recentOrders[0].amount.format()).toBe('$1.89');
      expect(recentOrders[0].status).toBe('COMPLETED');
      expect(recentOrders[2].status).toBe('PENDING');
    });

    it('parses placedAt into a real Date, not a string', async () => {
      const [first] = (await getSummary.execute()).value.recentOrders;

      expect(first.placedAt).toBeInstanceOf(Date);
      expect(Number.isNaN(first.placedAt.getTime())).toBe(false);
      expect(first.relativeTime()).toBe('2 mins ago');
      expect(first.dateTimeAttribute).toBe(first.placedAt.toISOString());
    });

    it('picks up an order placed during the session', async () => {
      const { FetchHttpClient } = await import('@/shared/infrastructure/http/fetch-http-client');
      const { CookieSessionStore } = await import('@/shared/infrastructure/storage/cookie-session-store');
      const sessions = new CookieSessionStore();
      const http = new FetchHttpClient({ baseUrl: 'http://localhost:3000/api/v1', getAccessToken: () => sessions.getAccessToken() });

      await http.post('/orders/checkout', {
        paymentMethod: 'CARD',
        items: [{ productId: 'prod-25', quantity: 1 }],
        billingInfo: {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 234 567 8909',
        },
      });

      const { recentOrders } = (await getSummary.execute()).value;

      expect(recentOrders[0].productSummary).toBe('Spotify Premium 1 Month');
    });
  });
});
