'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  Banknote,
  LogOut,
  X,
  Users,
  Building2,
  Stethoscope,
  MessageSquare,
  ScrollText,
  BarChart3,
  Settings as SettingsIcon,
  Flag,
} from 'lucide-react';
import { useAdminSession } from '@/lib/admin/admin-session';
import { useAdminLogout } from '@/features/admin/admin-auth-hooks';
import { useAdminBadgeCounts } from '@/features/admin/admin-badges';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUI } from '@/lib/store/theme';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  { title: 'Overview', items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Moderation',
    items: [
      { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
      { href: '/admin/reviews', label: 'Reviews', icon: Flag },
    ],
  },
  {
    title: 'Directory',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
      { href: '/admin/professionals', label: 'Professionals', icon: Stethoscope },
      { href: '/admin/contact', label: 'Contact', icon: MessageSquare },
    ],
  },
  {
    title: 'Finance',
    items: [{ href: '/admin/billing', label: 'Billing', icon: Banknote }],
  },
  {
    title: 'Insights',
    items: [{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 }],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
      { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const logout = useAdminLogout();
  const admin = useAdminSession((s) => s.session);
  const counts = useAdminBadgeCounts();

  const handleSignOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.push('/'),
      onSettled: () => router.push('/'),
    });
  };

  const sections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.map((item) => ({
      ...item,
      badgeCount:
        item.href === '/admin/verification'
          ? counts.verification
          : item.href === '/admin/reviews'
            ? counts.flagged + counts.pendingModeration
            : undefined,
    })),
  }));

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
          'admin-shell fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg bg-muted ring-1 ring-border shadow-sm">
              <ShieldCheck className="h-5 w-5 p-0.5 text-primary" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href + '/')) ||
                    (item.href === '/admin/dashboard' && pathname === '/admin');
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badgeCount ? (
                          <Badge variant="destructive" className="font-semibold">{item.badgeCount}</Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <p className="mb-2 truncate text-xs text-muted-foreground">
            Signed in as{' '}
            <span className="font-medium text-foreground">
              {admin?.user.email?.split('@')[0] ?? 'admin'}
            </span>
          </p>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            disabled={logout.isPending}
            className="flex w-full items-center justify-start gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}