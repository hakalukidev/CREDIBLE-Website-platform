'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/auth/require-auth';
import { DashboardSidebar } from './dashboard-sidebar';
import { ProfileDialog } from '@/features/business/profile-dialog';
import { VerificationDialog } from '@/features/business/verification-dialog';
import { SubscriptionDialog } from '@/features/business/subscription-dialog';
import { VerificationStatusBanner } from '@/features/verification/verification-status-banner';
import { useUI } from '@/lib/store/theme';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Shared shell for all authenticated `/business/*` dashboard pages.
 *
 * Dialog ownership: the layout owns the open/close state for the three
 * popup dialogs (profile, verification, subscription) and also renders the
 * verification status banner on the dashboard route. The dialogs are mounted
 * on every `/business/*` route so the sidebar buttons work consistently —
 * if the user clicks "Verification" from `/business/profile` the dialog
 * still opens over the current page.
 *
 * The `/business/{profile,verification,subscription}` route files are
 * fallbacks for direct navigation and render the same bodies in
 * page-form (`variant="page"`) underneath the dialog overlay.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RequireAuth role={['BUSINESS', 'CUSTOMER']}>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);

  const [profileOpen, setProfileOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  const onDashboard = pathname === '/business/dashboard';

  // Always-on. The dashboard page also fetches `businesses/me/profile`; we
  // share the React Query cache key so this is a free lookup once any
  // consumer has populated the cache.
  const { data: profile } = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: { id: string; displayName: string; verificationStatus: string };
      }>('/businesses/me/profile');
      return res.data.data;
    },
  });

  const activeDialogs = new Set<'profile' | 'verification' | 'subscription'>();
  if (profileOpen) activeDialogs.add('profile');
  if (verificationOpen) activeDialogs.add('verification');
  if (subscriptionOpen) activeDialogs.add('subscription');

  // Always mount the dialogs so the sidebar buttons are functional on any
  // `/business/*` route. A closed `<Dialog>` is a no-op (Radix portals
  // nothing), so there's no visible cost when a dialog is closed.
  //
  // The profile dialog gets an `onOpenVerification` callback that closes
  // itself and opens the verification dialog — so the verification banner
  // inside the profile popup swaps directly to the verification popup.
  const openVerificationFromProfile = () => {
    setProfileOpen(false);
    setVerificationOpen(true);
  };

  return (
    <>
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onOpenVerification={openVerificationFromProfile}
      />
      <VerificationDialog
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
      />
      <SubscriptionDialog
        open={subscriptionOpen}
        onOpenChange={setSubscriptionOpen}
      />
      <div className="container-wide grid gap-6 py-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <DashboardSidebar
          onProfileClick={() => setProfileOpen(true)}
          onVerificationClick={() => setVerificationOpen(true)}
          onSubscriptionClick={() => setSubscriptionOpen(true)}
          activeDialogs={activeDialogs}
        />
        <div className="min-w-0 space-y-4">
          <div className="mb-4 flex items-center gap-3 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          {onDashboard && (
            <VerificationStatusBanner
              target="business"
              entityId={profile?.id ?? null}
              onCta={() => setVerificationOpen(true)}
              hideWhenApproved={false}
            />
          )}
          {children}
        </div>
      </div>
    </>
  );
}
