'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CopyFieldProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  label: string;
  value: string;
  displayValue?: React.ReactNode;
  onCopied?: () => void;
  onCopyFailed?: (error: unknown) => void;
}

const FEEDBACK_DURATION_MS = 2000;

export function CopyField({
  label,
  value,
  displayValue,
  onCopied,
  onCopyFailed,
  className,
  ...props
}: CopyFieldProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (!hasCopied) {
      return;
    }
    const timeoutId = window.setTimeout(() => setHasCopied(false), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [hasCopied]);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      onCopied?.();
    } catch (error) {
      onCopyFailed?.(error);
    }
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)} {...props}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-2xl font-semibold text-green-500 mt-2">
          {displayValue ?? value}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none mt-6 cursor-pointer"
      >
        {hasCopied ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {hasCopied ? `${label} copied` : ''}
      </span>
    </div>
  );
}
