'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { CategoryCard, EmptyState } from '@/components/molecules';
import { type Category } from '@/modules/catalog/domain/entities/category';
import {
  CategoryIcon,
  getCategoryTone,
} from '@/modules/catalog/presentation/lib/category-icons';
import { ROUTES } from '@/shared/routes';

export interface CategoriesSectionProps {
  categories?: readonly Category[];
  isLoading?: boolean;
}

const GRID_CLASS = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';

export function CategoriesSection({ categories, isLoading = false }: CategoriesSectionProps) {
  return (
    <section aria-labelledby="dashboard-categories" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="dashboard-categories"
          className="font-heading text-base font-semibold tracking-tight text-foreground"
        >
          Categories
        </h2>
        <Link
          href={ROUTES.marketplace}
          className="rounded-md text-xs font-semibold text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {isLoading || !categories ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, index) => (
            <CategoryCard.Skeleton key={index} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Layers aria-hidden="true" />}
          title="No categories yet"
          description="Categories appear here once the catalogue has been organised."
        />
      ) : (
        <div className={GRID_CLASS}>
          {categories.map((category) => (
            <CategoryCard
              key={category.slug}
              name={category.name}
              itemCountLabel={category.itemCountLabel}
              icon={<CategoryIcon iconKey={category.iconKey} />}
              tone={getCategoryTone(category.iconKey)}
              href={`${ROUTES.marketplace}?category=${encodeURIComponent(category.slug)}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
