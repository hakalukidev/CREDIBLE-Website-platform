import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';

/**
 * Authenticated admin shell. `AdminLayout` enforces the dedicated admin-session
 * guard and renders the isolated layout (dark + red accent, own sidebar/header)
 * for every `/admin/*` page except the `/admin/login` gateway, which lives
 * outside this `(protected)` route group.
 */
export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}