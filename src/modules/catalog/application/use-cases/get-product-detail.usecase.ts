import { type DomainError, ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type Product } from '../../domain/entities/product';
import { type IProductRepository } from '../../domain/repositories/product-repository.interface';

export class GetProductDetailUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  public async execute(sku: string): Promise<Result<Product, DomainError>> {
    const trimmed = (sku ?? '').trim();

    if (trimmed.length === 0) {
      return Result.fail(
        new ValidationError('A product SKU is required.', { sku: 'A product SKU is required.' })
      );
    }

    return this.productRepo.getProductBySku(trimmed);
  }
}
