import * as React from 'react';
import Link from 'next/link';
import { IconTile, type IconTileTone } from '../atoms/icon-tile';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export interface CategoryCardProps {
  name: string;
  itemCountLabel: string;
  icon: React.ReactNode;
  href: string;
  tone?: IconTileTone;
  className?: string;
}

export function CategoryCard({
  name,
  itemCountLabel,
  icon,
  href,
  tone = 'primary',
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-subtle/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className
      )}
    >
      <IconTile tone={tone} size="md">
        {icon}
      </IconTile>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="block text-xs text-muted-foreground">{itemCountLabel}</span>
      </span>
    </Link>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Skeleton className="size-10 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

CategoryCard.Skeleton = CategoryCardSkeleton;
