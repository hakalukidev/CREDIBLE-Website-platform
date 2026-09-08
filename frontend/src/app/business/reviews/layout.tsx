import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/business/dashboard-layout';

export default function ReviewsSubLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}