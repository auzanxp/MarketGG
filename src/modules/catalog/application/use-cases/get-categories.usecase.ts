import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type Category } from '../../domain/entities/category';
import { type IProductRepository } from '../../domain/repositories/product-repository.interface';

export class GetCategoriesUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  public async execute(): Promise<Result<Category[], DomainError>> {
    return this.productRepo.getCategories();
  }
}
