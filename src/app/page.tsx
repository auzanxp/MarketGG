import { redirect } from 'next/navigation';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/routes';

export default function RootPage() {
  redirect(DEFAULT_AUTHENTICATED_ROUTE);
}
