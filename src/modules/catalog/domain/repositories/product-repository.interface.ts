import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type PaginatedResult } from '@/shared/domain/pagination';
import { type Category } from '../entities/category';
import { type Product } from '../entities/product';

export const PRODUCT_SORT_OPTIONS = [
  'popular',
  'newest',
  'price_asc',
  'price_desc',
  'rating',
] as const;

export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

export interface ProductFilters {
  query?: string;
  category?: string;
  publisher?: string;
  sortBy?: ProductSort;
  page?: number;
  limit?: number;
}

export type PaginatedProducts = PaginatedResult<Product>;

export interface IProductRepository {
  getProducts(filters?: ProductFilters): Promise<Result<PaginatedProducts, DomainError>>;
  getProductById(id: string): Promise<Result<Product, DomainError>>;
  getProductBySku(sku: string): Promise<Result<Product, DomainError>>;
  getCategories(): Promise<Result<Category[], DomainError>>;
  getPublishers(): Promise<Result<string[], DomainError>>;
}
