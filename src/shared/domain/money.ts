import { BaseValueObject } from './base-value-object';

interface MoneyProps {
  amount: number;
  currency: string;
}

export interface MoneySnapshot {
  amount: number;
  currency: string;
}

export class Money extends BaseValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  public static create(amount: number, currency = 'USD'): Money {
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid monetary amount');
    }
    return new Money({ amount: Math.round(amount * 100) / 100, currency: currency.toUpperCase() });
  }

  public static zero(currency = 'USD'): Money {
    return new Money({ amount: 0, currency: currency.toUpperCase() });
  }

  public get amount(): number {
    return this.props.amount;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  public multiply(multiplier: number): Money {
    return Money.create(this.amount * multiplier, this.currency);
  }

  public format(locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  /** RSC hydration needs plain fields; prototype getters are not serialized by JSON.stringify. */
  public toJSON(): MoneySnapshot {
    return { amount: this.props.amount, currency: this.props.currency };
  }

  public static fromJSON(value: Money | MoneySnapshot): Money {
    return value instanceof Money ? value : Money.create(value.amount, value.currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: cannot operate between ${this.currency} and ${other.currency}`);
    }
  }
}
