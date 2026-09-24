'use client';

/**
 * Legacy /dashboard/businesses — deep-links to the "Your Pages"
 * tab on the viewer's own profile via the `#pages` hash anchor.
 */

import { DashboardRedirect } from '@/components/dashboard-redirect';

export default function LegacyDashboardBusinessesPage() {
  return <DashboardRedirect target={(handle) => `/profile/${handle}#pages`} />;
}
