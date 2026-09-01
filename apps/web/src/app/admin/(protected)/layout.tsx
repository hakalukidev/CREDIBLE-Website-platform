import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { RequireAuth } from '@/components/auth/require-auth';

/**
 * Authenticated admin shell. Wraps every `/admin/*` page (except `/admin/login`)
 * in a session guard + sidebar layout. The route group `(protected)` keeps the
 * guard from intercepting the public login page.
 */
export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </RequireAuth>
  );
}
