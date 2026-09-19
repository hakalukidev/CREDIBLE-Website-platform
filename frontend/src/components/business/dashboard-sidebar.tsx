'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User2,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  LogOut,
  X,
} from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import { useSession } from '@/lib/store/session';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUI } from '@/lib/store/theme';

interface NavItem {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * If provided, the sidebar renders a `<button>` that calls this handler
   * instead of a `<Link>` to `href`. Used for items that open popup dialogs
   * over the dashboard (Profile / Verification / Subscription).
   */
  onClick?: () => void;
  /**
   * When true, the item is rendered as "active" regardless of the current
   * pathname. Used while a dialog is open so the sidebar stays highlighted
   * even though the URL hasn't changed.
   */
  forceActive?: boolean;
}

interface Props {
  /**
   * Override the click handler for the Profile nav item. The dashboard layout
   * passes a setter that opens the Profile dialog.
   */
  onProfileClick?: () => void;
  onVerificationClick?: () => void;
  onSubscriptionClick?: () => void;
  /** Set of items that should be force-highlighted (their dialog is open). */
  activeDialogs?: ReadonlySet<'profile' | 'verification' | 'subscription'>;
}

export function DashboardSidebar({
  onProfileClick,
  onVerificationClick,
  onSubscriptionClick,
  activeDialogs,
}: Props = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const clear = useSession((s) => s.clear);

  const handleSignOut = () => {
    clear();
    router.push('/');
  };

  const items: NavItem[] = [
    { href: '/business/dashboard', label: 'Overview', icon: LayoutDashboard },
    {
      href: '/business/profile',
      label: 'Profile',
      icon: User2,
      onClick: onProfileClick,
      forceActive: activeDialogs?.has('profile'),
    },
    { href: '/business/reviews', label: 'Reviews', icon: MessageSquare },
    {
      href: '/business/verification',
      label: 'Verification',
      icon: ShieldCheck,
      onClick: onVerificationClick,
      forceActive: activeDialogs?.has('verification'),
    },
    {
      href: '/business/subscription',
      label: 'Subscription',
      icon: CreditCard,
      onClick: onSubscriptionClick,
      forceActive: activeDialogs?.has('subscription'),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
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
        aria-label="Dashboard navigation"
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/business/dashboard" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg bg-white ring-1 ring-black/5 shadow-sm">
              <SafeImage src="/logo.jpg" alt="Credible" fill sizes="32px" priority />
            </span>
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
            {items.map((item) => {
              const isActive =
                item.forceActive ||
                pathname === item.href ||
                pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              const className = cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              );

              return (
                <li key={item.href}>
                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        setSidebarOpen(false);
                      }}
                      className={className}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={className}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )}
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
