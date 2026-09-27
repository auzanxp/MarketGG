'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FilterTabItem<TValue extends string> {
  value: TValue;
  label: string;
  count?: number;
}

export interface FilterTabsProps<TValue extends string> {
  label: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
  items: readonly FilterTabItem<TValue>[];
  className?: string;
}

export function FilterTabs<TValue extends string>({
  label,
  value,
  onValueChange,
  items,
  className,
}: FilterTabsProps<TValue>) {
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const moveTo = (index: number) => {
    const bounded = (index + items.length) % items.length;
    onValueChange(items[bounded].value);
    buttonRefs.current[bounded]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveTo(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveTo(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveTo(0);
        break;
      case 'End':
        event.preventDefault();
        moveTo(items.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 scrollbar-none',
        className
      )}
    >
      {items.map((item, index) => {
        const isSelected = item.value === value;

        return (
          <button
            key={item.value}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none cursor-pointer',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[0.6875rem] tabular-nums',
                  isSelected ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
