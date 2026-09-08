'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, User2, MessageSquare, ShieldCheck, LogOut, X } from 'lucide-react';
import { useSession } from '@/lib/store/session';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUI } from '@/lib/store/theme';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/professional/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/professional/profile', label: 'Profile', icon: User2 },
  { href: '/professional/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/professional/verification', label: 'Verification', icon: ShieldCheck },
];

export function ProfessionalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const clear = useSession((s) => s.clear);

  const handleSignOut = () => {
    clear();
    router.push('/');
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        aria-label="Professional dashboard navigation"
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href={'/professional/dashboard' as never} className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">Credible</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex h-[calc(100%-4rem)] flex-col justify-between p-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href as never}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </nav>
      </aside>
    </>
  );
}
