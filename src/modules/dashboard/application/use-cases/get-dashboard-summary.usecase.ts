import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type DashboardSummary } from '../../domain/entities/dashboard-summary';
import { type IDashboardRepository } from '../../domain/repositories/dashboard-repository.interface';

export class GetDashboardSummaryUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  public async execute(): Promise<Result<DashboardSummary, DomainError>> {
    return this.dashboardRepo.getSummary();
  }
}
