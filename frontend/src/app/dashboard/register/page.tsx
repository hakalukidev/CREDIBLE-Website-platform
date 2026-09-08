'use client';

import { makeDynamicRoute } from '@/components/dashboard/route-skeleton';
import { PageHeader } from '@/components/dashboard/page-header';

const RegisterWizard = makeDynamicRoute(
  () =>
    import('@/components/dashboard/register/register-wizard').then((m) => ({
      default: m.RegisterWizard,
    })),
  'register',
);

export default function DashboardRegisterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Get on Credible"
        title="Register a page"
        description="Set up your business or professional page in two short steps. The same forms power the rest of the dashboard."
      />
      <RegisterWizard />
    </div>
  );
}
