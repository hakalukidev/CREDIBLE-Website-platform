'use client';

import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/auth/require-auth';
import { ProfessionalSidebar } from './professional-sidebar';
import { useUI } from '@/lib/store/theme';

interface ProfessionalDashboardLayoutProps {
  children: ReactNode;
}

/**
 * Shared shell for all authenticated `/professional/*` dashboard pages.
 * Mirrors the business dashboard layout but is role-gated to PROFESSIONAL.
 */
export function ProfessionalDashboardLayout({ children }: ProfessionalDashboardLayoutProps) {
  return (
    <RequireAuth role="PROFESSIONAL">
      <ProfessionalShell>{children}</ProfessionalShell>
    </RequireAuth>
  );
}

function ProfessionalShell({ children }: { children: ReactNode }) {
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  return (
    <div className="container-wide grid gap-6 py-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <ProfessionalSidebar />
      <div className="min-w-0">
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
        {children}
      </div>
    </div>
  );
}
