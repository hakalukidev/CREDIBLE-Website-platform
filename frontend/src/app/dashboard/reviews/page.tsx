'use client';

import { makeDynamicRoute } from '@/components/dashboard/route-skeleton';

const DashboardReviewsContent = makeDynamicRoute(
  () => import('./page-content').then((m) => ({ default: m.DashboardReviewsContent })),
  'reviews',
);

export default function DashboardReviewsPage() {
  return <DashboardReviewsContent />;
}
