import { z } from 'zod';
import { PaginationMetaSchema } from '@/shared/infrastructure/http/pagination';

export { PaginationMetaSchema } from '@/shared/infrastructure/http/pagination';

export const MoneyDtoSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().toUpperCase().regex(/^[A-Z]{3}$/).default('USD'),
});

export const ProductDtoSchema = z.object({
  id: z.string().min(1),
  sku: z.string(),
  title: z.string().min(1),
  publisher: z.string(),
  description: z.string(),
  category: z.string(),
  price: MoneyDtoSchema,
  stock: z.number().int().nonnegative(),
  imageUrl: z.string(),
  rating: z.number().optional(),
  soldCount: z.number().int().nonnegative().optional(),
});

export const ProductListResponseSchema = z.object({
  items: z.array(ProductDtoSchema),
  meta: PaginationMetaSchema,
});

// Unknown category icons use a presentation fallback rather than rejecting the whole response.
export const CategoryDtoSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  itemCount: z.number().int().nonnegative(),
  iconKey: z.string(),
});

export const CategoryListResponseSchema = z.object({
  items: z.array(CategoryDtoSchema),
});

export const PublisherListResponseSchema = z.object({
  items: z.array(z.string()),
});

export type MoneyDto = z.infer<typeof MoneyDtoSchema>;
export type ProductDto = z.infer<typeof ProductDtoSchema>;
export type ProductListResponseDto = z.infer<typeof ProductListResponseSchema>;
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
export type CategoryListResponseDto = z.infer<typeof CategoryListResponseSchema>;
export type PublisherListResponseDto = z.infer<typeof PublisherListResponseSchema>;
