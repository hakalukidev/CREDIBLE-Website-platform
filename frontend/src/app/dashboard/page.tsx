'use client';

/**
 * Legacy /dashboard — redirects signed-in CUSTOMER users to their
 * profile overview. ADMIN/BUSINESS/PROFESSIONAL users should be
 * using their respective owner dashboards (`/admin`,
 * `/business/dashboard`, `/professional/dashboard`) and are also
 * redirected here — the public profile still works as a fallback.
 */

import { DashboardRedirect } from '@/components/dashboard-redirect';

export default function LegacyDashboardPage() {
  return <DashboardRedirect target={(handle) => `/profile/${handle}`} />;
}
