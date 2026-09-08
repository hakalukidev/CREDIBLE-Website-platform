'use client';

import { makeDynamicRoute } from '@/components/dashboard/route-skeleton';

const DashboardBusinessesContent = makeDynamicRoute(
  () => import('./page-content').then((m) => ({ default: m.DashboardBusinessesContent })),
  'list',
);

export default function DashboardBusinessesPage() {
  return <DashboardBusinessesContent />;
}
