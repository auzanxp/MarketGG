'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectFieldOption[];
  placeholder?: string;
  prefix?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  prefix,
  disabled = false,
  className,
}: SelectFieldProps) {
  return (
    <Select
      value={value}
      items={options}
      // Clearing emits null; retain the existing value because this control requires a selection.
      onValueChange={(next) => onValueChange(next ?? value)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        className={cn('h-10 min-w-0 gap-1.5 rounded-xl border-border bg-card text-sm', className)}
      >
        {prefix && (
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            {prefix}
          </span>
        )}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
