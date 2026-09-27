import { describe, expect, it } from 'vitest';
import { MetricDelta } from '../value-objects/metric-delta';

describe('MetricDelta', () => {
  it('rejects a non-finite percentage', () => {
    expect(() => MetricDelta.create(Number.NaN)).toThrow(/finite/i);
    expect(() => MetricDelta.create(Number.POSITIVE_INFINITY)).toThrow(/finite/i);
  });

  describe('direction', () => {
    it('classifies up, down, and exactly zero', () => {
      expect(MetricDelta.create(12).direction).toBe('up');
      expect(MetricDelta.create(-3.4).direction).toBe('down');
      expect(MetricDelta.create(0).direction).toBe('flat');
      expect(MetricDelta.flat().direction).toBe('flat');
    });
  });

  describe('isFavourable', () => {
    it('is separate from direction so an inverted metric can be added later', () => {
      expect(MetricDelta.create(12).isFavourable).toBe(true);
      expect(MetricDelta.create(0).isFavourable).toBe(true);
      expect(MetricDelta.create(-1).isFavourable).toBe(false);
    });
  });

  describe('format', () => {
    it('signs positive values and drops a trailing .0', () => {
      expect(MetricDelta.create(12).format()).toBe('+12%');
      expect(MetricDelta.create(12.0).format()).toBe('+12%');
      expect(MetricDelta.create(8.2).format()).toBe('+8.2%');
      expect(MetricDelta.create(15.3).format()).toBe('+15.3%');
    });

    it('lets the minus sign speak for negatives', () => {
      expect(MetricDelta.create(-3.4).format()).toBe('-3.4%');
      expect(MetricDelta.create(-10).format()).toBe('-10%');
    });

    it('renders zero without a sign', () => {
      expect(MetricDelta.create(0).format()).toBe('0%');
    });
  });

  it('rounds at construction so the value and its label can never disagree', () => {
    const delta = MetricDelta.create(12.349);

    expect(delta.percent).toBe(12.3);
    expect(delta.format()).toBe('+12.3%');
  });

  it('compares by value, being a value object', () => {
    expect(MetricDelta.create(12).equals(MetricDelta.create(12))).toBe(true);
    expect(MetricDelta.create(12).equals(MetricDelta.create(12.04))).toBe(true);
    expect(MetricDelta.create(12).equals(MetricDelta.create(13))).toBe(false);
  });
});
