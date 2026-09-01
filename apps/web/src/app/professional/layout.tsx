import type { ReactNode } from 'react';
import { ProfessionalDashboardLayout } from '@/components/professional/professional-dashboard-layout';

export default function ProfessionalLayout({ children }: { children: ReactNode }) {
  return <ProfessionalDashboardLayout>{children}</ProfessionalDashboardLayout>;
}