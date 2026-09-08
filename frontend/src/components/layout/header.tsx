'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LogOut,
  Menu,
  Search,
  User2,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SafeImage } from '@/components/ui/safe-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/lib/store/session';
import { useUI } from '@/lib/store/theme';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/browse', label: 'Browse' },
  { href: '/about', label: 'About' },
];

const ROLE_DASHBOARDS: Record<string, { href: string; label: string } | null> = {
  ADMIN: { href: '/admin', label: 'Admin' },
  BUSINESS: { href: '/business/dashboard', label: 'Business dashboard' },
  PROFESSIONAL: { href: '/professional/dashboard', label: 'Professional dashboard' },
};

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/browse') return pathname === '/browse' || pathname.startsWith('/browse/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HeaderSearchField({
  size = 'md',
  placeholder = 'Search businesses, professionals…',
  ariaLabel = 'Search businesses and professionals',
}: {
  size?: 'md' | 'lg';
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        name="q"
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'w-full rounded-full border-border/80 bg-muted/40 pl-9 pr-4 transition-colors placeholder:text-muted-foreground/80 hover:bg-muted/60 focus-visible:bg-background',
          size === 'lg' ? 'h-11' : 'h-10 text-sm',
        )}
      />
    </div>
  );
}

function HeaderNavLink({
  link,
  active,
  variant = 'underline',
}: {
  link: NavLink;
  active: boolean;
  variant?: 'underline' | 'dot';
}) {
  return (
    <Link
      href={link.href as never}
      aria-current={active ? 'page' : undefined}
      onClick={variant === 'dot' ? () => undefined : undefined}
      className={cn(
        variant === 'underline'
          ? 'relative inline-flex h-9 items-center rounded-md px-3 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          : 'flex items-center justify-between rounded-md px-2 py-3 text-sm font-medium transition-colors',
        active
          ? variant === 'underline'
            ? 'text-foreground'
            : 'bg-accent/60 text-foreground'
          : variant === 'underline'
            ? 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
      )}
    >
      {link.label}
      {active && variant === 'underline' && (
        <span
          aria-hidden
          className="absolute inset-x-3 -bottom-[15px] h-0.5 rounded-full bg-primary"
        />
      )}
      {active && variant === 'dot' && (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function UserAvatar({
  user,
  initials,
  size = 'sm',
}: {
  user: { avatar?: string | null; firstName?: string | null; email?: string };
  initials: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'md' ? 'h-9 w-9' : 'h-8 w-8';
  return (
    <Avatar className={cn(dim, 'ring-1 ring-border')}>
      {user.avatar && (
        <AvatarImage src={user.avatar} alt={user.firstName ?? ''} />
      )}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession((s) => s.session);
  const clear = useSession((s) => s.clear);
  const openAuth = useUI((s) => s.openAuth);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const initials = (session?.user.firstName ?? session?.user.email ?? '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleSignOut = () => {
    clear();
    router.push('/');
  };

  const dashboard = session ? ROLE_DASHBOARDS[session.user.role] : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container-wide flex h-16 items-center gap-3 md:gap-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Credible — go to homepage"
        >
          <span className="relative block h-8 w-8 overflow-hidden rounded-lg ring-1 ring-black/5 shadow-sm transition-shadow group-hover:shadow-md">
            <SafeImage
              src="/logo.jpg"
              alt="Credible"
              fill
              sizes="32px"
              priority
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Credible
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground lg:block">
              Verified
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 text-sm md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <HeaderNavLink
              key={link.href}
              link={link}
              active={isActive(pathname, link.href)}
              variant="underline"
            />
          ))}
        </nav>

        <form
          action="/search"
          className="ml-auto hidden flex-1 justify-end md:flex"
          role="search"
        >
          <div className="w-full max-w-sm">
            <HeaderSearchField />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open account menu"
                  className="h-10 w-10 rounded-full"
                >
                  <span className="block transition-transform hover:scale-[1.02]">
                    <UserAvatar user={session.user} initials={initials} />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={session.user} initials={initials} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {session.user.firstName ?? session.user.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dashboard && (
                  <DropdownMenuItem asChild>
                    <Link href={dashboard.href as never}>
                      <LayoutDashboard className="h-4 w-4" /> {dashboard.label}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={'/dashboard/profile' as never}>
                    <User2 className="h-4 w-4" /> Your Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden h-9 px-3 font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
                onClick={() => openAuth('signin')}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-full px-4 text-sm font-medium shadow-sm"
                onClick={() => openAuth('signup')}
              >
                Sign up
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-10 w-10 rounded-full md:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-16 z-30 bg-black/30 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="mobile-nav"
            className="container-wide relative z-40 border-t border-border/70 bg-background pb-6 pt-4 md:hidden"
          >
            <form action="/search" role="search" className="mb-3">
              <HeaderSearchField
                size="lg"
                placeholder="Search businesses…"
                ariaLabel="Search businesses"
              />
            </form>

            <nav className="flex flex-col" aria-label="Mobile primary">
              {NAV_LINKS.map((link) => (
                <HeaderNavLink
                  key={link.href}
                  link={link}
                  active={isActive(pathname, link.href)}
                  variant="dot"
                />
              ))}
            </nav>

            {!session && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
                <Button
                  variant="outline"
                  className="h-10 rounded-full"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuth('signin');
                  }}
                >
                  Sign in
                </Button>
                <Button
                  className="h-10 rounded-full"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuth('signup');
                  }}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
