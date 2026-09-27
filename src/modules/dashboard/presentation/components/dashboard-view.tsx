'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { AlertBanner } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/modules/catalog/presentation/hooks/use-catalog-taxonomy';
import { useSession } from '@/modules/identity/presentation/hooks/use-session';
import { useDashboardSummary } from '../hooks/use-dashboard-summary';
import { getTimeOfDayGreeting } from '../lib/dashboard-format';
import { CategoriesSection } from './categories-section';
import { RecentOrdersTable } from './recent-orders-table';
import { StatsRow } from './stats-row';

function GreetingHeader() {
  const { user, isLoading } = useSession();

  // Wait for the client session before using the local clock to avoid timezone hydration differences.
  if (isLoading || !user) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {getTimeOfDayGreeting()}, {user.firstName}{' '}
        <span role="img" aria-label="waving hand">
          👋
        </span>
      </h1>
      <p className="text-sm text-muted-foreground">
        Here&apos;s what&apos;s happening with your store today.
      </p>
    </div>
  );
}

export function DashboardView() {
  const summary = useDashboardSummary();
  const categories = useCategories();

  return (
    <div className="space-y-8">
      <GreetingHeader />

      {categories.isError && (
        <AlertBanner tone="error" title="Could not load categories">
          <p>{categories.error.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => void categories.refetch()}
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </AlertBanner>
      )}

      {summary.isError && (
        <AlertBanner tone="error" title="Could not load your dashboard">
          <p>{summary.error.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void summary.refetch()}
            className="mt-2"
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </AlertBanner>
      )}

      {!summary.isError && (
        <>
          <StatsRow stats={summary.data?.stats} isLoading={summary.isPending} />
          <CategoriesSection
            categories={categories.data}
            isLoading={categories.isPending}
          />
          <RecentOrdersTable
            orders={summary.data?.recentOrders}
            isLoading={summary.isPending}
          />
        </>
      )}

      {summary.isError && (
        <CategoriesSection categories={categories.data} isLoading={categories.isPending} />
      )}
    </div>
  );
}
