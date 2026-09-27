import { ContractMismatchError } from '@/shared/domain/errors';
import { Money } from '@/shared/domain/money';
import { Result } from '@/shared/domain/result';
import { Category, toCategoryIconKey } from '../../domain/entities/category';
import { Product } from '../../domain/entities/product';
import { type CategoryDto, type ProductDto } from '../schemas/product.schema';

export function mapProductDtoToDomain(
  dto: ProductDto,
  context = 'product payload'
): Result<Product, ContractMismatchError> {
  try {
    return Result.ok(
      Product.create({
        id: dto.id,
        sku: dto.sku,
        title: dto.title,
        publisher: dto.publisher,
        description: dto.description,
        category: dto.category,
        price: Money.create(dto.price.amount, dto.price.currency),
        stock: dto.stock,
        imageUrl: dto.imageUrl,
        rating: dto.rating,
        soldCount: dto.soldCount,
      })
    );
  } catch (error: unknown) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: product ${JSON.stringify(dto.id)} — ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
}

export function mapProductDtosToDomain(
  dtos: readonly ProductDto[],
  context = 'product list'
): Result<Product[], ContractMismatchError> {
  const products: Product[] = [];

  for (const dto of dtos) {
    const mapped = mapProductDtoToDomain(dto, context);
    if (mapped.isFailure) {
      return Result.fail(mapped.error);
    }
    products.push(mapped.value);
  }

  return Result.ok(products);
}

export function mapCategoryDtoToDomain(
  dto: CategoryDto,
  context = 'category payload'
): Result<Category, ContractMismatchError> {
  try {
    return Result.ok(
      Category.create({
        slug: dto.slug,
        name: dto.name,
        itemCount: dto.itemCount,
        iconKey: toCategoryIconKey(dto.iconKey),
      })
    );
  } catch (error: unknown) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: category ${JSON.stringify(dto.slug)} — ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
}

export function mapCategoryDtosToDomain(
  dtos: readonly CategoryDto[],
  context = 'category list'
): Result<Category[], ContractMismatchError> {
  const categories: Category[] = [];

  for (const dto of dtos) {
    const mapped = mapCategoryDtoToDomain(dto, context);
    if (mapped.isFailure) {
      return Result.fail(mapped.error);
    }
    categories.push(mapped.value);
  }

  return Result.ok(categories);
}
