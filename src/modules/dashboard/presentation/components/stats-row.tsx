import * as React from 'react';
import { DollarSign, Package, ShoppingCart } from 'lucide-react';
import { StatCard } from '@/components/molecules';
import { type StoreStats } from '../../domain/entities/dashboard-summary';
import { formatCount } from '../lib/dashboard-format';

export interface StatsRowProps {
  stats?: StoreStats;
  isLoading?: boolean;
}

const GRID_CLASS = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

export function StatsRow({ stats, isLoading = false }: StatsRowProps) {
  if (isLoading || !stats) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 3 }).map((_, index) => (
          <StatCard.Skeleton key={index} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: 'products',
      label: 'Products',
      value: formatCount(stats.totalProducts),
      icon: <Package />,
      tone: 'primary' as const,
      delta: stats.productsDelta,
    },
    {
      key: 'orders',
      label: 'Orders Today',
      value: formatCount(stats.ordersToday),
      icon: <ShoppingCart />,
      tone: 'info' as const,
      delta: stats.ordersDelta,
    },
    {
      key: 'revenue',
      label: 'Revenue Today',
      value: stats.revenueToday.format(),
      icon: <DollarSign />,
      tone: 'destructive' as const,
      delta: stats.revenueDelta,
    },
  ];

  return (
    <div className={GRID_CLASS}>
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.value}
          icon={card.icon}
          tone={card.tone}
          trend={{
            label: card.delta.format(),
            direction: card.delta.direction,
            isFavourable: card.delta.isFavourable,
            comparison: 'vs yesterday',
          }}
        />
      ))}
    </div>
  );
}
