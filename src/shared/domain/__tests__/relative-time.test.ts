import { describe, expect, it } from 'vitest';
import { formatRelativeTime, toDateTimeAttribute } from '../relative-time';

const NOW = new Date('2026-05-20T12:00:00.000Z');

function ago(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it('reads "just now" for anything very recent', () => {
    expect(formatRelativeTime(NOW, NOW)).toBe('just now');
    expect(formatRelativeTime(ago(10 * SECOND), NOW)).toBe('just now');
    expect(formatRelativeTime(ago(44 * SECOND), NOW)).toBe('just now');
  });

  it('switches to minutes past the threshold', () => {
    expect(formatRelativeTime(ago(45 * SECOND), NOW)).toBe('1 min ago');
    expect(formatRelativeTime(ago(2 * MINUTE), NOW)).toBe('2 mins ago');
    expect(formatRelativeTime(ago(59 * MINUTE), NOW)).toBe('59 mins ago');
  });

  it('matches the wording in the design', () => {
    expect(formatRelativeTime(ago(2 * MINUTE), NOW)).toBe('2 mins ago');
    expect(formatRelativeTime(ago(15 * MINUTE), NOW)).toBe('15 mins ago');
    expect(formatRelativeTime(ago(25 * MINUTE), NOW)).toBe('25 mins ago');
    expect(formatRelativeTime(ago(1 * HOUR), NOW)).toBe('1 hour ago');
  });

  it('pluralises correctly at every unit', () => {
    expect(formatRelativeTime(ago(1 * HOUR), NOW)).toBe('1 hour ago');
    expect(formatRelativeTime(ago(5 * HOUR), NOW)).toBe('5 hours ago');
    expect(formatRelativeTime(ago(1 * DAY), NOW)).toBe('1 day ago');
    expect(formatRelativeTime(ago(3 * DAY), NOW)).toBe('3 days ago');
  });

  it('falls back to an absolute date beyond a week', () => {
    expect(formatRelativeTime(ago(8 * DAY), NOW)).toBe('May 12, 2026');
    expect(formatRelativeTime(ago(400 * DAY), NOW)).toMatch(/2025$/);
  });

  it('does not render a negative duration when the clock is skewed', () => {
    const future = new Date(NOW.getTime() + 5 * MINUTE);

    expect(formatRelativeTime(future, NOW)).toBe('just now');
  });
});

describe('toDateTimeAttribute', () => {
  it('produces an ISO instant for the <time> element', () => {
    expect(toDateTimeAttribute(NOW)).toBe('2026-05-20T12:00:00.000Z');
  });
});
