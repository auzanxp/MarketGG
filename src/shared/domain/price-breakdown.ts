import { BaseValueObject } from './base-value-object';
import { Money, type MoneySnapshot } from './money';

// Shared cart preview policy; checkout totals returned by the server are authoritative.
export const PRICING_POLICY = {
  taxRate: 0.11,
  serviceFeeAmount: 0.5,
  defaultCurrency: 'USD',
} as const;

interface PriceBreakdownProps {
  subtotal: Money;
  tax: Money;
  serviceFee: Money;
}

export interface PriceBreakdownSnapshot {
  subtotal: MoneySnapshot;
  tax: MoneySnapshot;
  serviceFee: MoneySnapshot;
}

export class PriceBreakdown extends BaseValueObject<PriceBreakdownProps> {
  private constructor(props: PriceBreakdownProps) {
    super(props);
  }

  public static fromSubtotal(subtotal: Money): PriceBreakdown {
    if (subtotal.amount <= 0) {
      return PriceBreakdown.empty(subtotal.currency);
    }

    return new PriceBreakdown({
      subtotal,
      tax: subtotal.multiply(PRICING_POLICY.taxRate),
      serviceFee: Money.create(PRICING_POLICY.serviceFeeAmount, subtotal.currency),
    });
  }

  /** Preserve server totals on historical receipts instead of applying the current pricing policy. */
  public static fromParts(props: PriceBreakdownProps): PriceBreakdown {
    return new PriceBreakdown(props);
  }

  public static empty(currency: string = PRICING_POLICY.defaultCurrency): PriceBreakdown {
    return new PriceBreakdown({
      subtotal: Money.zero(currency),
      tax: Money.zero(currency),
      serviceFee: Money.zero(currency),
    });
  }

  public get subtotal(): Money {
    return this.props.subtotal;
  }

  public get tax(): Money {
    return this.props.tax;
  }

  public get serviceFee(): Money {
    return this.props.serviceFee;
  }

  public get total(): Money {
    return this.props.subtotal.add(this.props.tax).add(this.props.serviceFee);
  }

  public get taxLabel(): string {
    const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
      PRICING_POLICY.taxRate * 100
    );
    return `Tax (${percent}%)`;
  }

  public toJSON(): PriceBreakdownSnapshot {
    return {
      subtotal: this.props.subtotal.toJSON(),
      tax: this.props.tax.toJSON(),
      serviceFee: this.props.serviceFee.toJSON(),
    };
  }

  public static fromJSON(value: PriceBreakdown | PriceBreakdownSnapshot): PriceBreakdown {
    if (value instanceof PriceBreakdown) {
      return value;
    }
    return new PriceBreakdown({
      subtotal: Money.fromJSON(value.subtotal),
      tax: Money.fromJSON(value.tax),
      serviceFee: Money.fromJSON(value.serviceFee),
    });
  }
}
