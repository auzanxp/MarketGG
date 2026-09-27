import { type DomainError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type IHttpClient } from '@/shared/infrastructure/http/http-client.interface';
import { mapApiErrorToDomainError } from '@/shared/infrastructure/http/map-api-error';
import { parseContract } from '@/shared/infrastructure/validation/parse-contract';
import { type DashboardSummary } from '../../domain/entities/dashboard-summary';
import { type IDashboardRepository } from '../../domain/repositories/dashboard-repository.interface';
import { mapDashboardSummaryToDomain } from '../mappers/dashboard.mapper';
import { DashboardSummaryResponseSchema } from '../schemas/dashboard.schema';

export class HttpDashboardRepository implements IDashboardRepository {
  constructor(private readonly http: IHttpClient) {}

  public async getSummary(): Promise<Result<DashboardSummary, DomainError>> {
    try {
      const response = await this.http.get<unknown>('/dashboard/summary');

      const contract = parseContract(
        DashboardSummaryResponseSchema,
        response.data,
        'GET /dashboard/summary'
      );
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      return mapDashboardSummaryToDomain(contract.value);
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }
}
