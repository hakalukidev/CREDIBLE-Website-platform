import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminBillingLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}