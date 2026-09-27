import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type IProductRepository } from '../../domain/repositories/product-repository.interface';

export class GetPublishersUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  public async execute(): Promise<Result<string[], DomainError>> {
    return this.productRepo.getPublishers();
  }
}
