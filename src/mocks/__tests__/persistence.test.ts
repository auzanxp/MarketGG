import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockDatabase, MOCK_STORAGE_KEY, ACCESS_TOKEN_TTL_SECONDS } from '../db/mock-db';

const INPUT = {
  userId: 'usr-101', items: [{ productId: 'prod-1', quantity: 2 }], paymentMethod: 'CARD' as const,
  billingInfo: { fullName: 'John Doe', email: 'john.doe@example.com', phone: '+12345678900' },
};

afterEach(() => { window.localStorage.clear(); vi.useRealTimers(); });

describe('Mock database persistence', () => {
  it('restores orders, stock, tokens and login bookkeeping into a fresh database', () => {
    window.localStorage.clear();
    const before = new MockDatabase();
    before.enablePersistence(window.localStorage);
    const token = before.issueTokens('usr-101').accessToken;
    before.registerFailedLogin('john.doe@example.com');
    const order = before.createOrder(INPUT);
    const restored = new MockDatabase();
    expect(restored.enablePersistence(window.localStorage)).toBeNull();
    expect(restored.findUserByAccessToken(token)?.id).toBe('usr-101');
    expect(restored.getOrderById(order.id)).toEqual(order);
    expect(restored.getProductById('prod-1')!.stock).toBe(before.getProductById('prod-1')!.stock);
    for (let i = 0; i < 4; i++) restored.registerFailedLogin('john.doe@example.com');
    expect(restored.getLoginThrottle('john.doe@example.com').isBlocked).toBe(true);
  });

  it('keeps expiry and revocation effective after refresh', () => {
    vi.useFakeTimers();
    const before = new MockDatabase();
    before.enablePersistence(window.localStorage);
    const revoked = before.issueTokens('usr-101').accessToken;
    const expired = before.issueTokens('usr-101').accessToken;
    before.revokeAccessToken(revoked);
    vi.advanceTimersByTime(ACCESS_TOKEN_TTL_SECONDS * 1000 + 1);
    const restored = new MockDatabase();
    restored.enablePersistence(window.localStorage);
    expect(restored.findUserByAccessToken(revoked)).toBeUndefined();
    expect(restored.findUserByAccessToken(expired)).toBeUndefined();
  });

  it.each(['broken json', JSON.stringify({ version: 0 })])('resets invalid snapshots safely', (raw) => {
    window.localStorage.setItem(MOCK_STORAGE_KEY, raw);
    const db = new MockDatabase();
    expect(db.enablePersistence(window.localStorage)).toMatch(/reset/);
    expect(db.getOrders()).toHaveLength(6);
    expect(window.localStorage.getItem(MOCK_STORAGE_KEY)).toBeNull();
  });

  it('continues in memory when storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
    const db = new MockDatabase();
    expect(db.enablePersistence(blocked)).toMatch(/reset/);
    expect(() => db.createOrder(INPUT)).not.toThrow();
    expect(db.getOrders()).toHaveLength(7);
  });
});
