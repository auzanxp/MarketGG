import { Clapperboard, Gamepad2, Gift, Package, Smartphone } from 'lucide-react';
import type { IconTileTone } from '@/components/atoms';
import type { CategoryIconKey } from '../../domain/entities/category';

const CATEGORY_VISUALS: Record<
  CategoryIconKey,
  { Icon: typeof Gamepad2; tone: IconTileTone }
> = {
  games: { Icon: Gamepad2, tone: 'primary' },
  'mobile-topup': { Icon: Smartphone, tone: 'info' },
  'gift-cards': { Icon: Gift, tone: 'warning' },
  entertainment: { Icon: Clapperboard, tone: 'destructive' },
  other: { Icon: Package, tone: 'neutral' },
};

export function getCategoryVisuals(iconKey: CategoryIconKey) {
  return CATEGORY_VISUALS[iconKey] ?? CATEGORY_VISUALS.other;
}

export function CategoryIcon({ iconKey }: { iconKey: CategoryIconKey }) {
  const { Icon } = getCategoryVisuals(iconKey);
  return <Icon aria-hidden="true" />;
}

export function getCategoryTone(iconKey: CategoryIconKey): IconTileTone {
  return getCategoryVisuals(iconKey).tone;
}
