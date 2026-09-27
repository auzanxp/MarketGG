import { type DomainError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type IHttpClient } from '@/shared/infrastructure/http/http-client.interface';
import { mapApiErrorToDomainError } from '@/shared/infrastructure/http/map-api-error';
import { parseContract } from '@/shared/infrastructure/validation/parse-contract';
import { type Category } from '../../domain/entities/category';
import { type Product } from '../../domain/entities/product';
import {
  type IProductRepository,
  type PaginatedProducts,
  type ProductFilters,
} from '../../domain/repositories/product-repository.interface';
import {
  mapCategoryDtosToDomain,
  mapProductDtoToDomain,
  mapProductDtosToDomain,
} from '../mappers/product.mapper';
import {
  CategoryListResponseSchema,
  ProductDtoSchema,
  ProductListResponseSchema,
  PublisherListResponseSchema,
} from '../schemas/product.schema';

export class HttpProductRepository implements IProductRepository {
  constructor(private readonly http: IHttpClient) {}

  public async getProducts(
    filters?: ProductFilters
  ): Promise<Result<PaginatedProducts, DomainError>> {
    try {
      const response = await this.http.get<unknown>('/products', {
        params: {
          q: filters?.query,
          category: filters?.category,
          publisher: filters?.publisher,
          sortBy: filters?.sortBy,
          page: filters?.page,
          limit: filters?.limit,
        },
      });

      const contract = parseContract(ProductListResponseSchema, response.data, 'GET /products');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      const items = mapProductDtosToDomain(contract.value.items, 'GET /products');
      if (items.isFailure) {
        return Result.fail(items.error);
      }

      return Result.ok({
        items: items.value,
        total: contract.value.meta.total,
        page: contract.value.meta.page,
        limit: contract.value.meta.limit,
        totalPages: contract.value.meta.totalPages,
      });
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }

  public async getProductById(id: string): Promise<Result<Product, DomainError>> {
    try {
      const response = await this.http.get<unknown>(`/products/${encodeURIComponent(id)}`);

      const contract = parseContract(ProductDtoSchema, response.data, 'GET /products/:id');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      return mapProductDtoToDomain(contract.value, 'GET /products/:id');
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }

  public async getProductBySku(sku: string): Promise<Result<Product, DomainError>> {
    try {
      const response = await this.http.get<unknown>(`/products/sku/${encodeURIComponent(sku)}`);
      const contract = parseContract(ProductDtoSchema, response.data, 'GET /products/sku/:sku');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }
      return mapProductDtoToDomain(contract.value, 'GET /products/sku/:sku');
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }

  public async getCategories(): Promise<Result<Category[], DomainError>> {
    try {
      const response = await this.http.get<unknown>('/categories');

      const contract = parseContract(CategoryListResponseSchema, response.data, 'GET /categories');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      return mapCategoryDtosToDomain(contract.value.items, 'GET /categories');
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }

  public async getPublishers(): Promise<Result<string[], DomainError>> {
    try {
      const response = await this.http.get<unknown>('/publishers');

      const contract = parseContract(PublisherListResponseSchema, response.data, 'GET /publishers');
      if (contract.isFailure) {
        return Result.fail(contract.error);
      }

      return Result.ok(contract.value.items);
    } catch (error: unknown) {
      return Result.fail(mapApiErrorToDomainError(error));
    }
  }
}
