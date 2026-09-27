'use client';

import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductViewMode = 'grid' | 'list';

const OPTIONS: ReadonlyArray<{ value: ProductViewMode; label: string; Icon: typeof LayoutGrid }> = [
  { value: 'grid', label: 'Grid view', Icon: LayoutGrid },
  { value: 'list', label: 'List view', Icon: List },
];

export interface ViewToggleProps {
  value: ProductViewMode;
  onValueChange: (value: ProductViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onValueChange, className }: ViewToggleProps) {
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const moveTo = (index: number) => {
    const bounded = (index + OPTIONS.length) % OPTIONS.length;
    onValueChange(OPTIONS[bounded].value);
    buttonRefs.current[bounded]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label="Product layout"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5',
        className
      )}
    >
      {OPTIONS.map(({ value: optionValue, label, Icon }, index) => {
        const isSelected = value === optionValue;

        return (
          <button
            key={optionValue}
            ref={(node) => { buttonRefs.current[index] = node; }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onValueChange(optionValue)}
            onKeyDown={(event) => {
              if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? OPTIONS.length - 1
                  : index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1);
                moveTo(next);
              }
            }}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              isSelected
                ? 'bg-primary-subtle text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
