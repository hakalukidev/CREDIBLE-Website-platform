'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Menu,
  X,
  PenLine,
  Award,
  BookOpen,
  Briefcase,
  UserRound,
  LayoutGrid,
  Building2,
  Stethoscope,
  GraduationCap,
  Hammer,
  Car,
  ShoppingBag,
  Home as HomeIcon,
  Briefcase as BriefcaseIcon,
  Coffee,
  Gavel,
  Sparkles,
  Trophy,
  LayoutDashboard,
  User2,
  Compass,
  ExternalLink,
  Search as SearchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/lib/store/session';
import { useUI } from '@/lib/store/theme';
import { cn } from '@/lib/utils';
import { CredibleSearch } from './credible-search';
import { FloatingMenu } from './floating-menu';
import { MegaMenu, MegaMenuTriggerLabel } from './mega-menu';

interface NavLink {
  key: 'categories' | 'blog' | 'awards' | 'business' | 'professional';
  href: string;
  label: string;
  icon: typeof Award;
}

const NAV_LINKS: NavLink[] = [
  { key: 'categories', href: '/categories', label: 'Categories', icon: LayoutGrid },
  { key: 'blog', href: '/blog', label: 'Blog', icon: BookOpen },
  { key: 'awards', href: '/awards', label: 'Awards', icon: Award },
  { key: 'business', href: '/for-business', label: 'For Business', icon: Briefcase },
  { key: 'professional', href: '/for-professionals', label: 'For Professional', icon: UserRound },
];

const ROLE_DASHBOARDS: Record<string, { href: string; label: string } | null> = {
  ADMIN: { href: '/admin', label: 'Admin' },
  BUSINESS: { href: '/business/dashboard', label: 'Business dashboard' },
  PROFESSIONAL: { href: '/professional/dashboard', label: 'Professional dashboard' },
};

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
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
  const dim = size === 'md' ? 'h-9 w-9' : 'h-9 w-9';
  return (
    <Avatar className={cn(dim, 'ring-1 ring-border')}>
      {user.avatar && (
        <AvatarImage src={user.avatar} alt={user.firstName ?? ''} />
      )}
      <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/* ------------------------------------------------------------------------- */
/*  Mega-menu panel content                                                  */
/* ------------------------------------------------------------------------- */

const CATEGORY_GROUPS = [
  {
    label: 'Finance',
    items: [
      { label: 'Banks', icon: Building2, href: '/browse?category=banking' },
      { label: 'Insurance', icon: Building2, href: '/browse?category=insurance' },
    ],
  },
  {
    label: 'Tech',
    items: [
      { label: 'IT & Software', icon: Hammer, href: '/browse?category=technology' },
      { label: 'Retail', icon: ShoppingBag, href: '/browse?category=retail' },
    ],
  },
  {
    label: 'Lifestyle',
    items: [
      { label: 'Restaurants', icon: Coffee, href: '/browse?category=restaurants' },
      { label: 'Healthcare', icon: Stethoscope, href: '/browse?category=healthcare' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Education', icon: GraduationCap, href: '/browse?category=education' },
      { label: 'Legal', icon: Gavel, href: '/browse?category=legal' },
      { label: 'Automotive', icon: Car, href: '/browse?category=automotive' },
      { label: 'Real Estate', icon: HomeIcon, href: '/browse?category=real-estate' },
    ],
  },
];

const AWARDS_LINKS = [
  { label: 'Best in Category', sub: '2026 winners', href: '/awards', icon: Trophy },
  { label: 'Hall of Fame', sub: 'Multi-year winners', href: '/awards?view=hall-of-fame', icon: Sparkles },
  { label: 'Past Winners', sub: '2025 cycle', href: '/awards?year=2025', icon: Award },
];

const BUSINESS_LINKS = [
  { label: 'Verification', sub: 'How it works', href: '/for-business#verification', icon: BriefcaseIcon },
  { label: 'Badges', sub: 'Showcase your trust', href: '/for-business#badges', icon: Award },
  { label: 'Pricing', sub: 'Plans for every team', href: '/for-business#pricing', icon: Sparkles },
  { label: 'Get Started', sub: 'Apply today', href: '/for-business#start', icon: PenLine },
];

const PROFESSIONAL_LINKS = [
  { label: 'Professional Profile', sub: 'Build your page', href: '/for-professionals#profile', icon: UserRound },
  { label: 'Get Verified', sub: 'Earn your badge', href: '/for-professionals#verification', icon: BriefcaseIcon },
  { label: 'Awards', sub: 'Best in profession', href: '/for-professionals#awards', icon: Award },
  { label: 'Get Started', sub: 'Apply today', href: '/for-professionals#start', icon: PenLine },
];

interface PanelLink {
  label: string;
  sub: string;
  href: string;
  icon: typeof Award;
}

function MegaLinkGrid({ items }: { items: PanelLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href as never}
            className="group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:bg-muted"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {item.sub}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CategoriesPanel() {
  return (
    <div className="w-[640px]">
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href as never}
                      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="flex-1 font-medium text-foreground">{item.label}</span>
                      <ExternalLink
                        aria-hidden
                        className="h-3 w-3 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-border/60 pt-3">
        <Link
          href={'/categories' as never}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          View all categories
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
  cta,
  href,
  tone = 'primary',
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  tone?: 'primary' | 'gold';
}) {
  return (
    <div
      className={cn(
        'relative w-72 overflow-hidden rounded-2xl border p-4 shadow-card',
        tone === 'primary'
          ? 'border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-gold/10'
          : 'border-gold-300/60 bg-gradient-to-br from-gold-100 to-gold-grad',
      )}
    >
      <p
        className={cn(
          'mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
          tone === 'primary' ? 'text-primary' : 'text-gold-700',
        )}
      >
        {eyebrow}
      </p>
      <h4 className="font-display text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      <Link
        href={href as never}
        className={cn(
          'mt-3 inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5',
          tone === 'primary'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-gold text-gold-foreground hover:bg-gold/90',
        )}
      >
        {cta}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  The header component                                                     */
/* ------------------------------------------------------------------------- */

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession((s) => s.session);
  const clear = useSession((s) => s.clear);
  const openAuth = useUI((s) => s.openAuth);
  const openSearch = useUI((s) => s.openSearchOverlay);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showFloating, setShowFloating] = useState(false);
  const lastScrollY = useRef(0);

  /* Track scroll position + direction to drive floating-pill visibility. */
  useEffect(() => {
    const THRESHOLD = 80;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 4);
        if (y > THRESHOLD && y > lastScrollY.current) {
          setShowFloating(true);
        } else if (y < THRESHOLD || y < lastScrollY.current - 8) {
          setShowFloating(false);
        }
        lastScrollY.current = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile drawer on route change. */
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Lock body scroll while mobile drawer is open. */
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
    <>
      {/* Floating pill (desktop + mobile) */}
      <FloatingMenu visible={showFloating} />

      {/* Default header — full-width mega nav, content centered. */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={showFloating ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'sticky top-0 z-30 w-full border-b bg-card/95 backdrop-blur-md transition-shadow',
          scrolled ? 'border-border/80 shadow-header' : 'border-border/60',
          showFloating && 'pointer-events-none',
        )}
        aria-label="Site header"
      >
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-4 md:h-[72px] md:gap-5 md:px-6">
          {/* ----- Left: logo + nav ----- */}
          <Link
            href="/"
            aria-label="Credible — go to homepage"
            className="group flex shrink-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="relative block h-9 w-9 overflow-hidden rounded-full bg-white ring-1 ring-black/5 shadow-sm transition-all group-hover:shadow-md group-hover:ring-primary/30">
              <SafeImage
                src="/logo.jpg"
                alt="Credible"
                fill
                sizes="36px"
                priority
              />
            </span>
            <span className="hidden font-display text-[15px] font-bold tracking-tight text-foreground md:inline">
              Credible
            </span>
          </Link>

          {/* Desktop left nav (≥ xl) */}
          <nav
            aria-label="Primary"
            className="ml-1 hidden items-center xl:flex"
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return <DesktopNavItem key={link.key} link={link} active={active} />;
            })}
          </nav>

          {/* Mid nav (lg only — collapse to "More" / icons at 1024–1279) */}
          <nav
            aria-label="Primary mid"
            className="ml-1 hidden items-center lg:flex xl:hidden"
          >
            {NAV_LINKS.slice(0, 3).map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.key}
                  href={link.href as never}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'nav-underline px-3 py-1.5 text-[13px] font-medium transition-colors duration-200',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                  data-active={active}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ----- Center: search (the hero) ----- */}
          <div className="mx-2 flex flex-1 justify-center md:mx-4">
            {/* Desktop ≥ md: full search with ⌘K */}
            <div className="hidden w-full max-w-[360px] md:block lg:max-w-[420px]">
              <CredibleSearch variant="lg" />
            </div>
          </div>

          {/* ----- Right: auth + actions ----- */}
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
            {session ? (
              <MegaMenu
                triggerMode="click"
                align="right"
                size="md"
                widthClass="w-60"
                trigger={({ open }) => (
                  <button
                    type="button"
                    aria-label="Open account menu"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition-all hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <UserAvatar user={session.user} initials={initials} />
                  </button>
                )}
              >
                {({ close }) => (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 border-b border-border/60 px-2 pb-3">
                      <UserAvatar user={session.user} initials={initials} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {session.user.firstName ?? session.user.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    {dashboard && (
                      <button
                        onClick={() => {
                          router.push(dashboard.href as never);
                          close();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        {dashboard.label}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Use the slug if available, fall back to the id.
                        const handle = session?.user?.username ?? session?.user?.id ?? 'me';
                        router.push(`/profile/${handle}` as never);
                        close();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <User2 className="h-4 w-4 text-primary" />
                      Your Profile
                    </button>
                    <button
                      onClick={() => {
                        router.push('/browse' as never);
                        close();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <Compass className="h-4 w-4 text-primary" />
                      Explore
                    </button>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      onClick={() => {
                        handleSignOut();
                        close();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </MegaMenu>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden h-9 rounded-full border-border/80 px-4 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 sm:inline-flex"
                  onClick={() => openAuth('signin')}
                >
                  Login
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-full px-4 text-sm font-semibold shadow-sm transition-all hover:-translate-y-px hover:shadow-pop"
                  onClick={() => openAuth('signup')}
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile: search icon + hamburger */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Open search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground md:hidden"
            >
              <SearchIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground md:hidden"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 top-14 z-40 bg-black/30 backdrop-blur-sm md:hidden"
                aria-hidden
              />
              <motion.nav
                key="drawer"
                id="mobile-nav"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="container-wide relative z-50 border-t border-border/60 bg-background pb-6 pt-4 md:hidden"
                aria-label="Mobile primary"
              >
                <div className="flex flex-col">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(pathname, link.href);
                    return (
                      <Link
                        key={link.key}
                        href={link.href as never}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted',
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        <span className="flex-1">{link.label}</span>
                        {active && (
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-4">
                  {!session ? (
                    <>
                      <Button
                        variant="outline"
                        className="h-10 rounded-full"
                        onClick={() => {
                          setMobileOpen(false);
                          openAuth('signin');
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        className="h-10 rounded-full"
                        onClick={() => {
                          setMobileOpen(false);
                          openAuth('signup');
                        }}
                      >
                        Sign Up
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="col-span-2 h-10 rounded-full"
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}

/* ------------------------------------------------------------------------- */
/*  Desktop nav item — wraps MegaMenu for the dropdown nav items, plain Link */
/*  for "Blog" which has no dropdown per spec.                                */
/* ------------------------------------------------------------------------- */

function DesktopNavItem({ link, active }: { link: NavLink; active: boolean }) {
  const triggerEl = (
    <MegaMenuTriggerLabel label={link.label} open={active} ariaProps={{ 'aria-haspopup': true, 'aria-expanded': active }} />
  );

  switch (link.key) {
    case 'blog':
      return (
        <Link
          href={link.href as never}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'nav-underline px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200',
            active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
          data-active={active}
        >
          {link.label}
        </Link>
      );

    case 'categories':
      return (
        <MegaMenu trigger={() => triggerEl} align="left" widthClass="w-[640px]">
          {() => <CategoriesPanel />}
        </MegaMenu>
      );

    case 'awards':
      return (
        <MegaMenu trigger={() => triggerEl} align="left" widthClass="w-[640px]">
          {() => (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Awards
                </p>
                <MegaLinkGrid items={AWARDS_LINKS} />
              </div>
              <FeatureCard
                eyebrow="2026 cycle"
                title="Best in Category"
                body="The businesses and professionals with the highest verified trust scores take home a Credible Award."
                cta="See winners"
                href="/awards"
                tone="gold"
              />
            </div>
          )}
        </MegaMenu>
      );

    case 'business':
      return (
        <MegaMenu trigger={() => triggerEl} align="left" widthClass="w-[640px]">
          {() => (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  For business
                </p>
                <MegaLinkGrid items={BUSINESS_LINKS} />
              </div>
              <FeatureCard
                eyebrow="Verification"
                title="Get Credible Verified"
                body="Earn your badge in 48 hours. Drop it on your site, email signature, and socials."
                cta="Apply now"
                href="/for-business"
                tone="primary"
              />
            </div>
          )}
        </MegaMenu>
      );

    case 'professional':
      return (
        <MegaMenu trigger={() => triggerEl} align="left" widthClass="w-[640px]">
          {() => (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  For professionals
                </p>
                <MegaLinkGrid items={PROFESSIONAL_LINKS} />
              </div>
              <FeatureCard
                eyebrow="Stand out"
                title="Build your profile"
                body="A single verified profile page with reviews, badges, and awards — shareable anywhere."
                cta="Get verified"
                href="/for-professionals"
                tone="primary"
              />
            </div>
          )}
        </MegaMenu>
      );
  }
}
