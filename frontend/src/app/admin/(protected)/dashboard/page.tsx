'use client';

import { AdminOverview } from '@/components/admin/admin-overview';

/**
 * Canonical admin landing route. The admin gateway redirects here after a
 * successful sign-in (`/admin/dashboard`). `/admin` renders the same content.
 */
export default function AdminDashboardPage() {
  return <AdminOverview />;
}