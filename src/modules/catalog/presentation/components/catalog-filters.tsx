'use client';

import * as React from 'react';
import {
  SearchField,
  SelectField,
  ViewToggle,
  type ProductViewMode,
  type SelectFieldOption,
} from '@/components/molecules';
import { type Category } from '../../domain/entities/category';
import { type ProductSort } from '../../domain/repositories/product-repository.interface';
import { NO_FILTER } from '../lib/catalog-search-params';

const SORT_OPTIONS: readonly SelectFieldOption[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
];

export interface CatalogFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;

  category: string;
  onCategoryChange: (value: string) => void;
  categories: readonly Category[];

  publisher: string;
  onPublisherChange: (value: string) => void;
  publishers: readonly string[];

  sort: ProductSort;
  onSortChange: (value: ProductSort) => void;

  view: ProductViewMode;
  onViewChange: (value: ProductViewMode) => void;

  isTaxonomyLoading?: boolean;
}

export function CatalogFilters({
  searchInput,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  publisher,
  onPublisherChange,
  publishers,
  sort,
  onSortChange,
  view,
  onViewChange,
  isTaxonomyLoading = false,
}: CatalogFiltersProps) {
  const categoryOptions = React.useMemo<SelectFieldOption[]>(
    () => [
      { value: NO_FILTER, label: 'All Categories' },
      ...categories.map((item) => ({ value: item.slug, label: item.name })),
    ],
    [categories]
  );

  const publisherOptions = React.useMemo<SelectFieldOption[]>(
    () => [
      { value: NO_FILTER, label: 'All Games' },
      ...publishers.map((name) => ({ value: name, label: name })),
    ],
    [publishers]
  );

  return (
    <div className="space-y-3">
      <SearchField
        label="Search products"
        placeholder="Search products..."
        value={searchInput}
        onValueChange={onSearchChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          label="Filter by category"
          value={category}
          onValueChange={onCategoryChange}
          options={categoryOptions}
          disabled={isTaxonomyLoading}
          className="w-full sm:w-44"
        />

        <SelectField
          label="Filter by game or brand"
          value={publisher}
          onValueChange={onPublisherChange}
          options={publisherOptions}
          disabled={isTaxonomyLoading}
          className="w-full sm:w-44"
        />

        <SelectField
          label="Sort products"
          prefix="Sort by:"
          value={sort}
          onValueChange={(value) => onSortChange(value as ProductSort)}
          options={SORT_OPTIONS}
          className="w-full sm:w-52"
        />

        <div className="ms-auto hidden sm:block">
          <ViewToggle value={view} onValueChange={onViewChange} />
        </div>
      </div>
    </div>
  );
}
