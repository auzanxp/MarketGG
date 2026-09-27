import type { Metadata } from 'next';
import { DashboardView } from '@/modules/dashboard/presentation/components/dashboard-view';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Store performance at a glance: products, orders, revenue, and activity.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
