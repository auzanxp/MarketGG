import { describe, expect, it } from 'vitest';
import { PAGINATION_ELLIPSIS, buildPaginationRange } from '../pagination';

const E = PAGINATION_ELLIPSIS;

describe('buildPaginationRange', () => {
  it('lists every page when there are few enough to fit', () => {
    expect(buildPaginationRange(1, 1)).toEqual([1]);
    expect(buildPaginationRange(2, 4)).toEqual([1, 2, 3, 4]);
    expect(buildPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns nothing when there are no pages', () => {
    expect(buildPaginationRange(1, 0)).toEqual([]);
  });

  it('collapses only the far side when near the start', () => {
    expect(buildPaginationRange(1, 20)).toEqual([1, 2, E, 20]);
    expect(buildPaginationRange(2, 20)).toEqual([1, 2, 3, E, 20]);
    expect(buildPaginationRange(3, 20)).toEqual([1, 2, 3, 4, E, 20]);
  });

  it('collapses only the near side when close to the end', () => {
    expect(buildPaginationRange(20, 20)).toEqual([1, E, 19, 20]);
    expect(buildPaginationRange(19, 20)).toEqual([1, E, 18, 19, 20]);
  });

  it('collapses both sides in the middle', () => {
    expect(buildPaginationRange(10, 20)).toEqual([1, E, 9, 10, 11, E, 20]);
  });

  it('never replaces a single hidden page with an ellipsis', () => {
    expect(buildPaginationRange(4, 10)).toEqual([1, 2, 3, 4, 5, E, 10]);
  });

  it('always keeps the first and last page reachable', () => {
    for (const current of [1, 5, 10, 15, 20]) {
      const range = buildPaginationRange(current, 20);
      expect(range[0]).toBe(1);
      expect(range[range.length - 1]).toBe(20);
    }
  });

  it('never repeats a page', () => {
    for (const current of [1, 2, 3, 10, 18, 19, 20]) {
      const pages = buildPaginationRange(current, 20).filter(
        (item): item is number => item !== PAGINATION_ELLIPSIS
      );
      expect(new Set(pages).size).toBe(pages.length);
    }
  });

  it('widens the window with more siblings', () => {
    expect(buildPaginationRange(10, 20, 2)).toEqual([1, E, 8, 9, 10, 11, 12, E, 20]);
  });
});
