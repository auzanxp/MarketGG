'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { BrandLogo, Spinner, TextDivider } from '@/components/atoms';
import { AlertBanner, FormField, PasswordInput, SocialAuthButton } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type FieldErrors, ValidationError } from '@/shared/domain/errors';
import { useZodForm } from '@/shared/presentation/hooks/use-zod-form';

import { useLogin } from '../hooks/use-login';
import { LOGIN_FORM_INITIAL_VALUES, loginFormSchema } from '../schemas/login-form.schema';

const DEMO_ACCOUNT = {
  email: 'john.doe@example.com',
  password: 'password123',
} as const;

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false';

export interface LoginFormProps {
  redirectTo: string;
}

function notImplemented(feature: string) {
  toast.info(`${feature} is not part of this iteration yet.`, {
    description: 'The sign-in flow is the focus of this milestone.',
  });
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();

  const login = useLogin({
    onSuccess: () => router.replace(redirectTo),
  });

  const form = useZodForm({
    schema: loginFormSchema,
    initialValues: LOGIN_FORM_INITIAL_VALUES,
    onSubmit: async (values) => {
      // The mutation error is rendered below; avoid an unhandled rejection here.
      await login.mutateAsync(values).catch(() => undefined);
    },
  });

  const email = form.fieldProps('email');
  const password = form.fieldProps('password');

  const serverFieldErrors: FieldErrors =
    login.error instanceof ValidationError ? login.error.fieldErrors : {};
  const hasServerFieldErrors = Object.keys(serverFieldErrors).length > 0;

  const formLevelError = login.error && !hasServerFieldErrors ? login.error : null;

  const isBusy = login.isPending || login.isSuccess;

  const fillDemoAccount = () => {
    form.setValue('email', DEMO_ACCOUNT.email);
    form.setValue('password', DEMO_ACCOUNT.password);
  };

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col items-center gap-5 text-center">
        <BrandLogo size="md" />
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Welcome back{' '}
            <span role="img" aria-label="waving hand">
              👋
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Login to your account and continue shopping.
          </p>
        </div>
      </header>

      {formLevelError && (
        <AlertBanner
          tone={formLevelError.code === 'RATE_LIMITED' ? 'warning' : 'error'}
          title={formLevelError.code === 'RATE_LIMITED' ? 'Too many attempts' : 'Unable to sign in'}
        >
          {formLevelError.message}
        </AlertBanner>
      )}

      <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          label="Email"
          htmlFor={email.id}
          messageId={email['aria-describedby']}
          error={form.errors.email ?? serverFieldErrors.email}
        >
          <Input
            {...email}
            type="email"
            size="lg"
            placeholder="your@email.com"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            disabled={isBusy}
            required
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <FormField
            label="Password"
            htmlFor={password.id}
            messageId={password['aria-describedby']}
            error={form.errors.password ?? serverFieldErrors.password}
          >
            <PasswordInput
              {...password}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isBusy}
              required
            />
          </FormField>

          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => notImplemented('Password recovery')}
            className="h-auto self-end p-0 text-xs font-medium"
          >
            Forgot password?
          </Button>
        </div>

        <Button type="submit" size="xl" disabled={isBusy} className="mt-1 w-full font-semibold">
          {isBusy ? (
            <>
              <Spinner size="sm" label={null} />
              Signing in…
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      <TextDivider>or continue with</TextDivider>

      <div className="grid grid-cols-2 gap-3">
        <SocialAuthButton
          provider="google"
          disabled={isBusy}
          onClick={() => notImplemented('Google sign-in')}
        />
        <SocialAuthButton
          provider="apple"
          disabled={isBusy}
          onClick={() => notImplemented('Apple sign-in')}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => notImplemented('Registration')}
          className="h-auto p-0 text-sm font-semibold"
        >
          Sign up
        </Button>
      </p>

      {/* {IS_MOCK_MODE && (
        <AlertBanner tone="info" title="Demo mode" className="text-left">
          <p>
            The backend is mocked with MSW. Sign in with{' '}
            <code className="font-mono text-[0.75rem]">{DEMO_ACCOUNT.email}</code> /{' '}
            <code className="font-mono text-[0.75rem]">{DEMO_ACCOUNT.password}</code>.
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={fillDemoAccount}
            disabled={isBusy}
            className="mt-1 h-auto p-0 text-xs font-semibold"
          >
            Fill demo credentials
          </Button>
        </AlertBanner>
      )} */}
    </div>
  );
}
