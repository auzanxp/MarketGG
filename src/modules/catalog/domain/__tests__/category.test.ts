import { describe, expect, it } from 'vitest';
import { Category, toCategoryIconKey } from '../entities/category';

function makeCategory(overrides: Partial<Parameters<typeof Category.create>[0]> = {}) {
  return Category.create({
    slug: 'gift-cards',
    name: 'Gift Cards',
    itemCount: 532,
    iconKey: 'gift-cards',
    ...overrides,
  });
}

describe('Category', () => {
  it('rejects broken invariants', () => {
    expect(() => makeCategory({ slug: '  ' })).toThrow(/slug cannot be empty/i);
    expect(() => makeCategory({ name: '  ' })).toThrow(/name cannot be empty/i);
    expect(() => makeCategory({ itemCount: -1 })).toThrow(/cannot be negative/i);
  });

  it('identifies by slug', () => {
    expect(makeCategory().id).toBe('gift-cards');
    expect(makeCategory().equals(makeCategory({ name: 'Renamed' }))).toBe(true);
    expect(makeCategory().equals(makeCategory({ slug: 'games' }))).toBe(false);
  });

  describe('itemCountLabel', () => {
    it('groups thousands', () => {
      expect(makeCategory({ itemCount: 1245 }).itemCountLabel).toBe('1,245 items');
    });

    it('handles the singular', () => {
      expect(makeCategory({ itemCount: 1 }).itemCountLabel).toBe('1 item');
    });

    it('handles zero', () => {
      expect(makeCategory({ itemCount: 0 }).itemCountLabel).toBe('0 items');
    });
  });
});

describe('toCategoryIconKey', () => {
  it('passes known keys through', () => {
    expect(toCategoryIconKey('games')).toBe('games');
    expect(toCategoryIconKey('mobile-topup')).toBe('mobile-topup');
    expect(toCategoryIconKey('gift-cards')).toBe('gift-cards');
    expect(toCategoryIconKey('entertainment')).toBe('entertainment');
  });

  it('degrades an unknown key instead of failing', () => {
    expect(toCategoryIconKey('crypto')).toBe('other');
    expect(toCategoryIconKey('')).toBe('other');
  });
});
