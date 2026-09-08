'use client';

import { makeDynamicRoute } from '@/components/dashboard/route-skeleton';

const DashboardProfileContent = makeDynamicRoute(
  () => import('./page-content').then((m) => ({ default: m.DashboardProfileContent })),
  'profile',
);

export default function DashboardProfilePage() {
  return <DashboardProfileContent />;
}
