'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OptionCardItem<TValue extends string> {
  value: TValue;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

export interface OptionCardGroupProps<TValue extends string> {
  label: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
  options: readonly OptionCardItem<TValue>[];
  name?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

export function OptionCardGroup<TValue extends string>({
  label,
  value,
  onValueChange,
  options,
  name,
  hideLabel = false,
  disabled = false,
  className,
}: OptionCardGroupProps<TValue>) {
  const generatedName = React.useId();
  const groupName = name ?? generatedName;

  return (
    <fieldset className={cn('min-w-0', className)} disabled={disabled}>
      <legend
        className={cn(
          hideLabel ? 'sr-only' : 'mb-3 text-sm font-semibold text-foreground'
        )}
      >
        {label}
      </legend>

      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors',
              'hover:border-primary/40',
              'has-[input:checked]:border-primary has-[input:checked]:bg-primary-subtle/40',
              'has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50',
              'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50 has-[input:disabled]:hover:border-border'
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onValueChange(option.value)}
              className="peer sr-only"
            />

            <span
              aria-hidden="true"
              className={cn(
                'flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 border-input transition-colors',
                'after:size-2 after:scale-0 after:rounded-full after:bg-primary after:transition-transform after:content-[""]',
                'peer-checked:border-primary peer-checked:after:scale-100'
              )}
            />

            {option.icon && (
              <span aria-hidden="true" className="shrink-0 text-muted-foreground [&_svg]:size-4.5">
                {option.icon}
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {option.label}
              </span>
              {option.description && (
                <span className="block truncate text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>

            {option.trailing && <span className="shrink-0">{option.trailing}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
