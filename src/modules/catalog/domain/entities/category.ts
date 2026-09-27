import { BaseEntity } from '@/shared/domain/base-entity';

// Unknown icon keys fall back to other so new categories remain usable.
export type CategoryIconKey =
  | 'games'
  | 'mobile-topup'
  | 'gift-cards'
  | 'entertainment'
  | 'other';

export const CATEGORY_ICON_KEYS: readonly CategoryIconKey[] = [
  'games',
  'mobile-topup',
  'gift-cards',
  'entertainment',
  'other',
];

export function toCategoryIconKey(value: string): CategoryIconKey {
  return CATEGORY_ICON_KEYS.includes(value as CategoryIconKey)
    ? (value as CategoryIconKey)
    : 'other';
}

export interface CategoryProps {
  slug: string;
  name: string;
  itemCount: number;
  iconKey: CategoryIconKey;
}

export class Category extends BaseEntity<string> {
  private readonly props: CategoryProps;

  private constructor(props: CategoryProps) {
    super(props.slug);
    this.props = props;
  }

  public static create(props: CategoryProps): Category {
    if (props.slug.trim().length === 0) {
      throw new Error('Category slug cannot be empty');
    }
    if (props.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    if (props.itemCount < 0) {
      throw new Error(`Category itemCount cannot be negative: ${props.itemCount}`);
    }
    return new Category(props);
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get name(): string {
    return this.props.name;
  }

  public get itemCount(): number {
    return this.props.itemCount;
  }

  public get iconKey(): CategoryIconKey {
    return this.props.iconKey;
  }

  public get itemCountLabel(): string {
    const formatted = new Intl.NumberFormat('en-US').format(this.props.itemCount);
    return `${formatted} ${this.props.itemCount === 1 ? 'item' : 'items'}`;
  }
}
