'use client';

/**
 * Legacy /dashboard/reviews — deep-links to the "Reviews" tab on
 * the viewer's own profile via the `#reviews` hash anchor.
 */

import { DashboardRedirect } from '@/components/dashboard-redirect';

export default function LegacyDashboardReviewsPage() {
  return <DashboardRedirect target={(handle) => `/profile/${handle}#reviews`} />;
}
