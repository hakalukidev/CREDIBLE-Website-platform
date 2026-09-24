'use client';

/**
 * Legacy /dashboard/register — sends visitors to the public
 * register wizard at `/profile/register`. Auth is bypassed so
 * marketing links from search engines and emails still land on
 * the right surface without forcing sign-up first.
 */

import { DashboardRedirect } from '@/components/dashboard-redirect';

export default function LegacyDashboardRegisterPage() {
  return (
    <DashboardRedirect
      target="/profile/register"
      bypassAuthForRegister
    />
  );
}
