import { BaseValueObject } from '@/shared/domain/base-value-object';

interface MetricDeltaProps {
  percent: number;
}

export type MetricDirection = 'up' | 'down' | 'flat';

export class MetricDelta extends BaseValueObject<MetricDeltaProps> {
  private constructor(props: MetricDeltaProps) {
    super(props);
  }

  public static create(percent: number): MetricDelta {
    if (!Number.isFinite(percent)) {
      throw new Error(`MetricDelta requires a finite percentage, received ${percent}`);
    }
    return new MetricDelta({ percent: Math.round(percent * 10) / 10 });
  }

  public static flat(): MetricDelta {
    return new MetricDelta({ percent: 0 });
  }

  public get percent(): number {
    return this.props.percent;
  }

  public get direction(): MetricDirection {
    if (this.props.percent > 0) {
      return 'up';
    }
    if (this.props.percent < 0) {
      return 'down';
    }
    return 'flat';
  }

  public get isFavourable(): boolean {
    return this.props.percent >= 0;
  }

  public format(): string {
    const sign = this.props.percent > 0 ? '+' : '';
    const magnitude = Number.isInteger(this.props.percent)
      ? String(this.props.percent)
      : this.props.percent.toFixed(1);
    return `${sign}${magnitude}%`;
  }
}
