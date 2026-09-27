import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type DashboardSummary } from '../entities/dashboard-summary';

export interface IDashboardRepository {
  getSummary(): Promise<Result<DashboardSummary, DomainError>>;
}
