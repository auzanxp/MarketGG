import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SuccessMarkProps extends React.ComponentProps<'div'> {
  size?: 'md' | 'lg';
  withConfetti?: boolean;
}

const SIZES = {
  md: { ring: 'size-20', icon: 'size-9', halo: 'size-20' },
  lg: { ring: 'size-24', icon: 'size-11', halo: 'size-24' },
} as const;

// Fixed positions keep server and client markup identical.
const CONFETTI: ReadonlyArray<{
  className: string;
  shape: 'dot' | 'bar';
  delay: string;
}> = [
    { className: 'top-0 left-2 bg-primary', shape: 'dot', delay: '60ms' },
    { className: 'top-3 -right-1 bg-warning', shape: 'bar', delay: '140ms' },
    { className: '-top-2 right-8 bg-success', shape: 'dot', delay: '220ms' },
    { className: 'bottom-2 -left-3 bg-info', shape: 'bar', delay: '180ms' },
    { className: 'bottom-0 right-1 bg-primary/70', shape: 'dot', delay: '260ms' },
    { className: 'top-1/2 -left-6 bg-success/60', shape: 'dot', delay: '320ms' },
    { className: 'top-1/3 -right-6 bg-primary/60', shape: 'bar', delay: '380ms' },
  ];

export function SuccessMark({
  size = 'lg',
  withConfetti = true,
  className,
  ...props
}: SuccessMarkProps) {
  const dimensions = SIZES[size];

  return (
    <div
      aria-hidden="true"
      className={cn('relative inline-flex items-center justify-center', className)}
      {...props}
    >
      {withConfetti && (
        <div className="pointer-events-none absolute -inset-8">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              style={{ animationDelay: piece.delay }}
              className={cn(
                'absolute animate-in fade-in zoom-in-50 duration-500',
                piece.shape === 'dot' ? 'size-1.5 rounded-full' : 'h-2.5 w-1 rounded-full',
                piece.className
              )}
            />
          ))}
        </div>
      )}

      <span
        className={cn(
          'absolute rounded-full bg-success/15 animate-in fade-in duration-700',
          dimensions.halo,
          'scale-150'
        )}
      />

      <span
        className={cn(
          'relative flex items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/25 animate-in zoom-in-50 duration-500',
          dimensions.ring
        )}
      >
        <Check className={cn('stroke-3', dimensions.icon)} />
      </span>
    </div>
  );
}
