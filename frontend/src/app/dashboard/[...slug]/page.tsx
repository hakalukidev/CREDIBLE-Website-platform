'use client';

/**
 * Legacy /dashboard/<anything> — catch-all that drops the visitor on
 * their profile overview. Keeps analytics dashboards like
 * `/dashboard/stats` from 404'ing during the migration window.
 */

import { DashboardRedirect } from '@/components/dashboard-redirect';

export default function LegacyDashboardCatchAllPage() {
  return <DashboardRedirect target={(handle) => `/profile/${handle}`} />;
}
