import * as React from 'react';
import { IconTile, type IconTileTone } from '../atoms/icon-tile';
import { TrendIndicator } from '../atoms/trend-indicator';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: IconTileTone;
  trend?: {
    label: string;
    direction: 'up' | 'down' | 'flat';
    isFavourable?: boolean;
    comparison?: string;
  };
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'primary',
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <IconTile tone={tone} size="sm">
          {icon}
        </IconTile>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>

      <p className="font-heading text-2xl font-bold tracking-tight text-foreground">{value}</p>

      {trend && (
        <TrendIndicator
          label={trend.label}
          direction={trend.direction}
          isFavourable={trend.isFavourable}
          comparison={trend.comparison}
        />
      )}
    </article>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

StatCard.Skeleton = StatCardSkeleton;
