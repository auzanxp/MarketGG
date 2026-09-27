'use client';

import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { useUseCaseQuery } from '@/shared/presentation/hooks/use-use-case-query';
import { useSession, useSessionError } from '@/modules/identity/presentation/hooks/use-session';
import { type GetDashboardSummaryUseCase } from '../../application/use-cases/get-dashboard-summary.usecase';

export const DASHBOARD_SUMMARY_QUERY_KEY = ['dashboard', 'summary'] as const;

export function useDashboardSummary() {
  const { user } = useSession();
  const query = useUseCaseQuery<GetDashboardSummaryUseCase>(
    TOKENS.GetDashboardSummaryUseCase,
    [...DASHBOARD_SUMMARY_QUERY_KEY, user?.id],
    undefined,
    { staleTime: 1000 * 60, enabled: Boolean(user) }
  );
  useSessionError(query.error, user?.id);
  return query;
}
