import type { Metadata } from 'next';
import { AuthSplitTemplate } from '@/components/templates';
import { AuthBrandPanel } from '@/modules/identity/presentation/components/auth-brand-panel';
import { LoginForm } from '@/modules/identity/presentation/components/login-form';
import { REDIRECT_PARAM, sanitizeRedirectTarget } from '@/shared/routes';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to VocaMarket to top up your favorite games and digital products.',
};

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requested = params[REDIRECT_PARAM];

  const redirectTo = sanitizeRedirectTarget(
    Array.isArray(requested) ? requested[0] : requested
  );

  return (
    <AuthSplitTemplate aside={<AuthBrandPanel />}>
      <LoginForm redirectTo={redirectTo} />
    </AuthSplitTemplate>
  );
}
