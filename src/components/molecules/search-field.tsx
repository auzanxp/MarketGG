'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from '../ui/input';
import { cn } from '@/lib/utils';

export interface SearchFieldProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  label: string;
  showLabel?: boolean;
  value: string;
  onValueChange: (value: string) => void;
}

export function SearchField({
  label,
  showLabel = false,
  value,
  onValueChange,
  id,
  className,
  size = 'lg',
  ...props
}: SearchFieldProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hasValue = value.length > 0;

  return (
    <div className={cn('relative', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          showLabel ? 'mb-1.5 block text-sm font-medium text-foreground' : 'sr-only'
        )}
      >
        {label}
      </label>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={inputId}
          type="search"
          size={size}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          autoComplete="off"
          className={cn('pl-10 bg-white', hasValue && 'pr-10')}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => onValueChange('')}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
