'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuantityStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  hint?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

const SIZES = {
  sm: { button: 'size-7', input: 'h-7 w-10 text-xs', icon: 'size-3.5' },
  md: { button: 'size-9', input: 'h-9 w-14 text-sm', icon: 'size-4' },
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function QuantityStepper({
  value,
  onValueChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  label = 'Quantity',
  hint,
  size = 'md',
  disabled = false,
  className,
}: QuantityStepperProps) {
  const inputId = React.useId();
  const hintId = React.useId();
  const dimensions = SIZES[size];

  // A null draft displays the external value; commit typed input on blur or Enter.
  const [draft, setDraft] = React.useState<string | null>(null);

  // Button changes need a live announcement; typing is already echoed by assistive technology.
  const [liveMessage, setLiveMessage] = React.useState('');

  const commit = (next: number) => {
    const clamped = clamp(Number.isFinite(next) ? Math.floor(next) : min, min, max);
    setDraft(null);
    if (clamped !== value) {
      onValueChange(clamped);
    }
    return clamped;
  };

  const step = (delta: number) => {
    const next = commit(value + delta);
    setLiveMessage(`${label}: ${next}`);
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="group"
        aria-label={label}
        className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1"
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className={cn(
            'flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
            dimensions.button
          )}
        >
          <Minus className={dimensions.icon} aria-hidden="true" />
        </button>

        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          value={draft ?? String(value)}
          min={min}
          max={max}
          step={1}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(Number.parseInt(event.target.value, 10))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(Number.parseInt(event.currentTarget.value, 10));
            }
          }}
          className={cn(
            'rounded-lg border-0 bg-transparent text-center font-medium tabular-nums text-foreground [appearance:textfield] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            dimensions.input
          )}
        />

        <button
          type="button"
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className={cn(
            'flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
            dimensions.button
          )}
        >
          <Plus className={dimensions.icon} aria-hidden="true" />
        </button>
      </div>

      {hint && (
        <span id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </span>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </span>
    </div>
  );
}
