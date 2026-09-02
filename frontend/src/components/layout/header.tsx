'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LogOut,
  Menu,
  Search,
  User2,
  LayoutDashboard,
  X,
  Building2,
  Stethoscope,
  ChevronDown,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSession } from '@/lib/store/session';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/search', label: 'Browse' },
  { href: '/categories', label: 'Categories' },
  { href: '/about', label: 'About' },
  { href: '/widgets', label: 'Widgets' },
  { href: '/api-docs', label: 'API' },
];

const FOR_BUSINESS_OPTIONS = [
  {
    href: '/for-business',
    icon: Building2,
    title: 'For Business',
    body: 'Get your business verified, earn trust badges, and grow with public reviews.',
    cta: 'List your business',
  },
  {
    href: '/for-professionals',
    icon: Stethoscope,
    title: 'For Professionals',
    body: 'Showcase your expertise, collect verified reviews, and attract the right clients.',
    cta: 'List your profile',
  },
];

function ForBusinessMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:w-[520px]',
        'grid-cols-1 sm:grid-cols-2',
      )}
    >
      {FOR_BUSINESS_OPTIONS.map(({ href, icon: Icon, title, body, cta }) => (
        <Link
          key={href}
          href={href as never}
          onClick={onNavigate}
          className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="font-semibold text-foreground">{title}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
          <p className="mt-auto text-xs font-medium text-primary group-hover:underline">
            {cta} →
          </p>
        </Link>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const session = useSession((s) => s.session);
  const clear = useSession((s) => s.clear);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [forBusinessOpen, setForBusinessOpen] = useState(false);

  const initials = (session?.user.firstName ?? session?.user.email ?? '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleSignOut = () => {
    clear();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative block h-7 w-7 overflow-hidden rounded">
            <SafeImage
              src="/logo.jpg"
              alt="Credible"
              fill
              sizes="28px"
              priority
            />
          </span>
          <span className="text-lg font-bold tracking-tight">Credible</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href as never} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}

          {/* "For Business" — hover popover with two options */}
          <Popover open={forBusinessOpen} onOpenChange={setForBusinessOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-haspopup="dialog"
                aria-expanded={forBusinessOpen}
                onMouseEnter={() => {
                  if (!forBusinessOpen) setForBusinessOpen(true);
                }}
              >
                For Business
                <ChevronDown className="h-3 w-3" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={10}
              className="w-auto p-4"
              onMouseEnter={() => {
                if (!forBusinessOpen) setForBusinessOpen(true);
              }}
              onMouseLeave={() => setForBusinessOpen(false)}
            >
              <ForBusinessMenu onNavigate={() => setForBusinessOpen(false)} />
            </PopoverContent>
          </Popover>
        </nav>

        <form
          action="/search"
          className="ml-auto hidden md:flex flex-1 max-w-md items-center gap-2"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search businesses, professionals…"
              className="pl-9"
              aria-label="Search"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    {session.user.avatar && (
                      <AvatarImage src={session.user.avatar} alt={session.user.firstName ?? ''} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">
                    {session.user.firstName ?? session.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {session.user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                {session.user.role === 'BUSINESS' && (
                  <DropdownMenuItem asChild>
                    <Link href="/business/dashboard">
                      <LayoutDashboard className="h-4 w-4" /> Business dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {session.user.role === 'PROFESSIONAL' && (
                  <DropdownMenuItem asChild>
                    <Link href="/professional/dashboard">
                      <LayoutDashboard className="h-4 w-4" /> Professional dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/account/reviews">
                    <User2 className="h-4 w-4" /> Your reviews
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
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container-wide flex flex-col py-3" aria-label="Mobile navigation">
            <form action="/search" className="mb-3 flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search businesses…"
                  className="pl-9"
                  aria-label="Search"
                />
              </div>
            </form>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href as never}
                className="py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile "For Business" — opens a dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="py-2 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  For Business
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Get listed on Credible</DialogTitle>
                  <DialogDescription>
                    Pick the path that matches you — businesses and professionals each get their own workflow.
                  </DialogDescription>
                </DialogHeader>
                <ForBusinessMenu onNavigate={() => setMobileOpen(false)} />
              </DialogContent>
            </Dialog>
          </nav>
        </div>
      )}
    </header>
  );
}