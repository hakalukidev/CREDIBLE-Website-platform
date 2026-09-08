'use client';

// Left navigation rail for /dashboard routes. Rendered twice by
// `DashboardShell` (desktop <aside> + mobile <Sheet> drawer); the
// `SidebarContent` body is shared so the nav and user mini-card
// stay identical in either presentation.

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User2,
  MessageSquare,
  Building2,
  PlusCircle,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUI } from '@/lib/store/theme';
import { useSession } from '@/lib/store/session';
import { cn } from '@/lib/utils';
import { initials as buildInitials } from '@credible/shared';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: User2 },
  { href: '/dashboard/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/dashboard/businesses', label: 'Your Businesses', icon: Building2 },
  { href: '/dashboard/register', label: 'Register a Page', icon: PlusCircle },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function displayNameOf(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null | undefined): string {
  if (!user) return 'Signed-in user';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return full || user.email || 'Signed-in user';
}

function roleLabel(role?: string | null): string {
  if (!role) return 'Member';
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'BUSINESS':
      return 'Business owner';
    case 'PROFESSIONAL':
      return 'Professional';
    default:
      return 'Member';
  }
}

/**
 * Derive a stable pair of hues from the user's name/email so the avatar
 * fallback gradient feels personalised instead of one-size-fits-all blue.
 */
function avatarGradient(seed: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hueA = hash % 360;
  const hueB = (hueA + 48) % 360;
  return { from: `hsl(${hueA} 70% 55%)`, to: `hsl(${hueB} 75% 45%)` };
}

interface NavLinksProps {
  pathname: string | null;
  onNavigate?: () => void;
}

function NavLinks({ pathname, onNavigate }: NavLinksProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
        Workspace
      </p>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as never}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              active
                ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
              )}
            />
            <span
              className={cn(
                'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-transparent text-muted-foreground group-hover:bg-background/80 group-hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

interface UserCardProps {
  onSignOut: () => void;
}

function UserCard({ onSignOut }: UserCardProps) {
  const session = useSession((s) => s.session);
  const user = session?.user;
  const avatarInitials = buildInitials(user?.firstName, user?.lastName) || '?';
  const seed = (user?.email ?? user?.firstName ?? 'credible').toString();
  const gradient = useMemo(() => avatarGradient(seed), [seed]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/40 p-3 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.25)]">
      {/* Subtle decorative glow — purely cosmetic, non-interactive. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: `radial-gradient(circle, ${gradient.from}, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
          {user?.avatar && <AvatarImage src={user.avatar} alt={user.firstName ?? ''} />}
          <AvatarFallback
            className="text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
          >
            {avatarInitials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {displayNameOf(user)}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/80"
            />
            {roleLabel(user?.role)}
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Sign out
          </TooltipContent>
        </Tooltip>
      </div>

      {user?.email && (
        <p className="relative mt-2 truncate text-[11px] text-muted-foreground/80">{user.email}</p>
      )}
    </div>
  );
}

interface SidebarContentProps {
  pathname: string | null;
  onSignOut: () => void;
  onNavigate?: () => void;
}

export function SidebarContent({ pathname, onSignOut, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-4">
        <Link
          href={'/dashboard' as never}
          onClick={onNavigate}
          className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.5)] transition-transform duration-200 group-hover:scale-[1.04]">
            <ShieldCheck className="h-4 w-4" />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Credible
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard
            </span>
          </span>
        </Link>

        <Separator className="mt-4 bg-border/60" />
      </div>

      {/* Navigation - Scrollable middle */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>

      {/* User Card - Sticky at bottom */}
      <div className="flex-shrink-0 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 pt-0">
        <UserCard onSignOut={onSignOut} />
      </div>
    </div>
  );
}

interface UseSidebarHandlers {
  onSignOut: () => void;
  pathname: string | null;
}

export function useSidebarHandlers(): UseSidebarHandlers {
  const pathname = usePathname();
  const router = useRouter();
  const clear = useSession((s) => s.clear);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);

  const onSignOut = useCallback(() => {
    setSidebarOpen(false);
    clear();
    router.push('/');
  }, [setSidebarOpen, clear, router]);

  return { onSignOut, pathname };
}