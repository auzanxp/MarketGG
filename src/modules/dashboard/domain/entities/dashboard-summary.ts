import { type Money } from '@/shared/domain/money';
import { type MetricDelta } from '../value-objects/metric-delta';
import { type RecentOrder } from './recent-order';

export interface StoreStats {
  totalProducts: number;
  productsDelta: MetricDelta;
  ordersToday: number;
  ordersDelta: MetricDelta;
  revenueToday: Money;
  revenueDelta: MetricDelta;
}

export interface DashboardSummaryProps {
  stats: StoreStats;
  recentOrders: RecentOrder[];
}

export class DashboardSummary {
  private readonly props: DashboardSummaryProps;

  private constructor(props: DashboardSummaryProps) {
    this.props = props;
  }

  public static create(props: DashboardSummaryProps): DashboardSummary {
    if (props.stats.totalProducts < 0 || props.stats.ordersToday < 0) {
      throw new Error('DashboardSummary received negative counts');
    }
    return new DashboardSummary(props);
  }

  public get stats(): StoreStats {
    return this.props.stats;
  }

  public get recentOrders(): RecentOrder[] {
    return this.props.recentOrders;
  }

  public get hasRecentOrders(): boolean {
    return this.props.recentOrders.length > 0;
  }
}
