'use client';

import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/auth/require-auth';
import { DashboardSidebar } from './dashboard-sidebar';
import { useUI } from '@/lib/store/theme';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Shared shell for all authenticated `/business/*` dashboard pages.
 * Performs the role guard, then renders the sidebar + main panel.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RequireAuth role="BUSINESS">
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  return (
    <div className="container-wide grid gap-6 py-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <DashboardSidebar />
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