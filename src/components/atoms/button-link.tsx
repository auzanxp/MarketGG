import * as React from 'react';
import Link from 'next/link';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '../ui/button';
import { cn } from '@/lib/utils';

export interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, 'className'>,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

export function ButtonLink({
  variant = 'default',
  size = 'default',
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
