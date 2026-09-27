import { type DomainError, NotFoundError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { mockDb } from '@/mocks/db/mock-db';
import { logApiResponse } from '@/shared/infrastructure/http/api-debug';
import { toPaginatedResponse } from '@/shared/infrastructure/http/pagination';
import { parseContract } from '@/shared/infrastructure/validation/parse-contract';
import { type Category } from '../../domain/entities/category';
import { type Product } from '../../domain/entities/product';
import {
  type IProductRepository,
  type PaginatedProducts,
  type ProductFilters,
} from '../../domain/repositories/product-repository.interface';
import { mapCategoryDtosToDomain, mapProductDtoToDomain, mapProductDtosToDomain } from '../mappers/product.mapper';
import { CategoryListResponseSchema, ProductDtoSchema, ProductListResponseSchema, PublisherListResponseSchema } from '../schemas/product.schema';

// SSR reads the mock directly; browser MSW interceptors cannot handle server fetches.
export class LocalMockProductRepository implements IProductRepository {
  public async getProducts(
    filters?: ProductFilters
  ): Promise<Result<PaginatedProducts, DomainError>> {
    const startedAt = Date.now();
    const result = toPaginatedResponse(mockDb.getProducts({
      query: filters?.query,
      category: filters?.category,
      publisher: filters?.publisher,
      sortBy: filters?.sortBy,
      page: filters?.page,
      limit: filters?.limit,
    }));
    logApiResponse({ source: 'local-mock', method: 'GET', endpoint: '/products', status: 200, durationMs: Date.now() - startedAt, data: result });
    const contract = parseContract(ProductListResponseSchema, result, 'GET /products (local mock)');
    if (contract.isFailure) return Result.fail(contract.error);

    const items = mapProductDtosToDomain(contract.value.items, 'LocalMockProductRepository.getProducts');
    if (items.isFailure) {
      return Result.fail(items.error);
    }

    return Result.ok({
      items: items.value,
      ...contract.value.meta,
    });
  }

  public async getProductById(id: string): Promise<Result<Product, DomainError>> {
    const startedAt = Date.now();
    const dto = mockDb.getProductById(id);

    if (!dto) {
      const detail = 'We could not find the product you were looking for.';
      logApiResponse({ source: 'local-mock', method: 'GET', endpoint: `/products/${encodeURIComponent(id)}`, status: 404, durationMs: Date.now() - startedAt, data: { title: 'Product Not Found', status: 404, detail } });
      return Result.fail(new NotFoundError(detail));
    }
    logApiResponse({ source: 'local-mock', method: 'GET', endpoint: `/products/${encodeURIComponent(id)}`, status: 200, durationMs: Date.now() - startedAt, data: dto });
    const contract = parseContract(ProductDtoSchema, dto, 'GET /products/:id (local mock)');
    return contract.isFailure ? Result.fail(contract.error) : mapProductDtoToDomain(contract.value, 'LocalMockProductRepository.getProductById');
  }

  public async getProductBySku(sku: string): Promise<Result<Product, DomainError>> {
    const startedAt = Date.now();
    const dto = mockDb.getProductBySku(sku);
    const endpoint = `/products/sku/${encodeURIComponent(sku)}`;

    if (!dto) {
      const detail = 'We could not find the product you were looking for.';
      logApiResponse({ source: 'local-mock', method: 'GET', endpoint, status: 404, durationMs: Date.now() - startedAt, data: { title: 'Product Not Found', status: 404, detail } });
      return Result.fail(new NotFoundError(detail));
    }
    logApiResponse({ source: 'local-mock', method: 'GET', endpoint, status: 200, durationMs: Date.now() - startedAt, data: dto });
    const contract = parseContract(ProductDtoSchema, dto, 'GET /products/sku/:sku (local mock)');
    return contract.isFailure ? Result.fail(contract.error) : mapProductDtoToDomain(contract.value, 'LocalMockProductRepository.getProductBySku');
  }

  public async getCategories(): Promise<Result<Category[], DomainError>> {
    const startedAt = Date.now();
    const data = { items: mockDb.getCategories() };
    logApiResponse({ source: 'local-mock', method: 'GET', endpoint: '/categories', status: 200, durationMs: Date.now() - startedAt, data });
    const contract = parseContract(CategoryListResponseSchema, data, 'GET /categories (local mock)');
    return contract.isFailure ? Result.fail(contract.error) : mapCategoryDtosToDomain(contract.value.items, 'LocalMockProductRepository.getCategories');
  }

  public async getPublishers(): Promise<Result<string[], DomainError>> {
    const startedAt = Date.now();
    const data = { items: mockDb.getPublishers() };
    logApiResponse({ source: 'local-mock', method: 'GET', endpoint: '/publishers', status: 200, durationMs: Date.now() - startedAt, data });
    const contract = parseContract(PublisherListResponseSchema, data, 'GET /publishers (local mock)');
    return contract.isFailure ? Result.fail(contract.error) : Result.ok(contract.value.items);
  }
}
