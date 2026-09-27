'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '../ui/input';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  id: string;
}

export function PasswordInput({ id, className, size = 'lg', ...props }: PasswordInputProps) {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const ToggleIcon = isRevealed ? Eye : EyeOff;

  return (
    <div className="relative">
      <Input
        id={id}
        type={isRevealed ? 'text' : 'password'}
        size={size}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsRevealed((current) => !current)}
        aria-pressed={isRevealed}
        aria-controls={id}
        aria-label={isRevealed ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ToggleIcon className="size-4.5" aria-hidden="true" />
      </button>
    </div>
  );
}
