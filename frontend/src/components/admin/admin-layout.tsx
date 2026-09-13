'use client';

import type { ReactNode } from 'react';
import { Menu, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RequireAdmin } from './require-admin';
import { AdminSidebar } from './admin-sidebar';
import { AdminSessionTimer } from './admin-session-timer';
import { useAdminLogout } from '@/features/admin/admin-auth-hooks';
import { useUI } from '@/lib/store/theme';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * The fully-isolated admin shell. Distinct dark theme + red accent (via
 * `.admin-shell` in globals.css), its own sidebar/header, an explicit "Exit
 * Admin" affordance, and a 30-minute inactivity auto-logout.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const router = useRouter();
  const logout = useAdminLogout();

  const exitAdmin = () => {
    router.push('/');
    logout.mutate(undefined, { onSettled: () => router.push('/') });
  };

  return (
    <div className="admin-shell min-h-screen bg-zinc-950 text-zinc-100">
      <AdminSessionTimer onExpire={exitAdmin} />
      <div className="grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Restricted console
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Button
                variant="outline"
                className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={exitAdmin}
                disabled={logout.isPending}
              >
                Exit Admin
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}