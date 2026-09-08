'use client';

// Two-pane layout for /dashboard/*. Sidebar is a sticky rail on md+
// and a <Sheet> drawer on mobile — both render the same
// `SidebarContent`.

import { useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarContent, useSidebarHandlers } from './app-sidebar';
import { useSession } from '@/lib/store/session';
import { useUI } from '@/lib/store/theme';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const session = useSession((s) => s.session);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const { onSignOut, pathname } = useSidebarHandlers();

  const closeMobileDrawer = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);

  const firstName = session?.user.firstName;
  const greeting = firstName ? `Hi, ${firstName}` : 'Dashboard';

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        aria-label="Dashboard navigation"
        className="sticky top-0 z-20 hidden h-screen shrink-0 self-start border-r border-border/70 bg-card text-card-foreground md:flex md:w-56 md:flex-col lg:w-64 xl:w-72"
      >
        <SidebarContent pathname={pathname} onSignOut={onSignOut} />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open sidebar"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent
                pathname={pathname}
                onSignOut={onSignOut}
                onNavigate={closeMobileDrawer}
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-base font-semibold tracking-tight">{greeting}</h1>
        </header>

        <div className="flex-1 px-4 pb-8 pt-6 sm:px-6 md:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
