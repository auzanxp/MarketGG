import { type DomainError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { mockDb } from '@/mocks/db/mock-db';
import { logApiResponse } from '@/shared/infrastructure/http/api-debug';
import { parseContract } from '@/shared/infrastructure/validation/parse-contract';
import { type DashboardSummary } from '../../domain/entities/dashboard-summary';
import { type IDashboardRepository } from '../../domain/repositories/dashboard-repository.interface';
import { mapDashboardSummaryToDomain } from '../mappers/dashboard.mapper';
import { DashboardSummaryResponseSchema } from '../schemas/dashboard.schema';

export class LocalMockDashboardRepository implements IDashboardRepository {
  public async getSummary(): Promise<Result<DashboardSummary, DomainError>> {
    const startedAt = Date.now();
    const data = mockDb.getDashboardSummary();
    logApiResponse({ source: 'local-mock', method: 'GET', endpoint: '/dashboard/summary', status: 200, durationMs: Date.now() - startedAt, data });
    const contract = parseContract(DashboardSummaryResponseSchema, data, 'GET /dashboard/summary (local mock)');
    return contract.isFailure ? Result.fail(contract.error) : mapDashboardSummaryToDomain(contract.value, 'LocalMockDashboardRepository.getSummary');
  }
}
