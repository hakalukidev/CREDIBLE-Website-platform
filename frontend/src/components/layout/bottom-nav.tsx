'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PenLine, Trophy, User2 } from 'lucide-react';
import { useUI } from '@/lib/store/theme';
import { useSession } from '@/lib/store/session';
import { cn } from '@/lib/utils';

/**
 * Sticky bottom navigation — visible only on screens < 480px.
 *
 * 5 tabs: Home · Search · Write Review · Awards · Profile
 * - Home/Awards: route to those pages.
 * - Search: opens the full-screen `SearchOverlay`.
 * - Write Review: route to /submit-review.
 * - Profile: routes to /profile/[username] (or opens sign-in if logged out).
 */
export function BottomNav() {
  const pathname = usePathname();
  const session = useSession((s) => s.session);
  const openSearch = useUI((s) => s.openSearchOverlay);
  const openAuth = useUI((s) => s.openAuth);

  // Hide the nav while the search overlay is open (so the two don't fight).
  const searchOpen = useUI((s) => s.searchOverlayOpen);

  const items = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
      action: () => {},
      match: (p: string | null) => p === '/',
    },
    {
      key: 'search',
      label: 'Search',
      icon: Search,
      href: '#',
      action: () => openSearch(),
      match: () => false,
    },
    {
      key: 'review',
      label: 'Write Review',
      icon: PenLine,
      href: '/submit-review',
      action: () => {},
      match: (p: string | null) => (p ?? '').startsWith('/submit-review'),
    },
    {
      key: 'awards',
      label: 'Awards',
      icon: Trophy,
      href: '/awards',
      action: () => {},
      match: (p: string | null) => (p ?? '').startsWith('/awards'),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: User2,
      // Profile route is /profile/[username]. When signed-in, prefer the
      // human-friendly handle (username → slug → id) so the link works
      // even for users who never set a username.
      href: session
        ? `/profile/${session.user.username || session.user.slug || session.user.id}`
        : '#',
      action: () => {
        if (!session) openAuth('signin');
      },
      match: (p: string | null) => (p ?? '').startsWith('/profile/'),
    },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-glass-pill pb-[env(safe-area-inset-bottom)] shadow-lift md:hidden',
        searchOpen && 'hidden',
      )}
      style={{ maxWidth: 480 }}
    >
      <ul className="mx-auto grid h-16 max-w-[480px] grid-cols-5">
        {items.map(({ key, label, icon: Icon, href, action, match }) => {
          const active = match(pathname);
          const isAction = key === 'search' || (key === 'profile' && !session);
          if (isAction) {
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={action}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span>{label}</span>
                  {active && (
                    <span aria-hidden className="absolute top-1 h-1 w-6 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            );
          }
          return (
            <li key={key}>
              <Link
                href={href as never}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
                {active && (
                  <span aria-hidden className="absolute top-1 h-1 w-6 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
