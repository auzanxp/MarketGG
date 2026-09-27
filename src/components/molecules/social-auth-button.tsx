'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { AppleIcon, GoogleIcon } from '../atoms/provider-icons';
import { Spinner } from '../atoms/spinner';
import { cn } from '@/lib/utils';

export type AuthProvider = 'google' | 'apple';

const PROVIDERS: Record<AuthProvider, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  google: { label: 'Google', Icon: GoogleIcon },
  apple: { label: 'Apple', Icon: AppleIcon },
};

export interface SocialAuthButtonProps extends React.ComponentProps<typeof Button> {
  provider: AuthProvider;
  isLoading?: boolean;
}

export function SocialAuthButton({
  provider,
  isLoading = false,
  className,
  disabled,
  ...props
}: SocialAuthButtonProps) {
  const { label, Icon } = PROVIDERS[provider];

  return (
    <Button
      type="button"
      variant="outline"
      size="xl"
      disabled={disabled || isLoading}
      aria-label={`Continue with ${label}`}
      className={cn('w-full font-medium', className)}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" label={null} />
      ) : (
        <Icon className="size-4.5" />
      )}
      <span aria-hidden="true">{label}</span>
    </Button>
  );
}
