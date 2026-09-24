'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, PenLine, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUI } from '@/lib/store/theme';
import { CredibleSearch } from './credible-search';

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/categories', label: 'Categories' },
  { href: '/blog', label: 'Blog' },
  { href: '/awards', label: 'Awards' },
  { href: '/for-business', label: 'For Business' },
  { href: '/for-professionals', label: 'For Professional' },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Floating pill menu — appears at the top of the page once the user scrolls
 * past 80px. Hidden when the user scrolls back near the top (returns to the
 * default header).
 *
 *  - Desktop: rounded-full glass pill, 52px height, slide-down animation,
 *    auto-hides when scrolling up past the threshold.
 *  - Mobile (<768px): pill shrinks to [Logo] [Search] [Menu trigger]; tapping
 *    Menu opens a full-width bottom sheet with all nav items + search +
 *    auth buttons (delegated back to the parent header).
 */
export function FloatingMenu({
  visible,
}: {
  visible: boolean;
}) {
  const pathname = usePathname();
  const openSearchOverlay = useUI((s) => s.openSearchOverlay);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  // Lock body scroll while mobile sheet is open.
  React.useEffect(() => {
    if (!mobileSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSheetOpen]);

  return (
    <>
      {/* Floating pill — desktop */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="floating-pill"
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 top-4 z-40 hidden justify-center px-4 md:flex"
            aria-hidden={!visible}
          >
            <div
              className={cn(
                'pointer-events-auto flex h-[52px] w-auto max-w-[90vw] items-center gap-1 rounded-full bg-glass-pill px-2 shadow-floating-pill ring-1 ring-black/[0.06]',
              )}
            >
              {/* Credible logo mark */}
              <Link
                href="/"
                aria-label="Credible — home"
                className="flex h-9 w-9 shrink-0 items-center justify-center bg-white shadow-sm transition-transform hover:scale-105"
              >
                <span><Image src="/logo.jpg" alt="Credible" width={20} height={20} /></span>
              </Link>

              {/* Nav links */}
              <nav
                aria-label="Primary floating"
                className="flex items-center gap-0.5"
              >
                {NAV_LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href as never}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium transition-all duration-150',
                        active
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Vertical divider before CTA */}
              <div aria-hidden className="mx-1 h-5 w-px bg-border/80" />

              {/* CTA */}
              <Link
                href={'/browse' as never}
                className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-xs font-semibold text-gold-foreground shadow-sm ring-1 ring-gold/40 transition-all hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-md"
              >
                <span className="hidden lg:inline">Explore</span>
                <span className="inline lg:hidden">Explore</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating pill — mobile (<768px): [Logo] [Search] [Menu] */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="floating-pill-mobile"
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 md:hidden"
            aria-hidden={!visible}
          >
            <div
              className={cn(
                'pointer-events-auto flex h-[52px] w-auto max-w-[95vw] items-center gap-1 rounded-full bg-glass-pill px-2 shadow-floating-pill ring-1 ring-black/[0.06]',
              )}
            >
              <Link
                href="/"
                aria-label="Credible — home"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/40"
              >
                <span className="font-display text-sm font-bold text-primary">C</span>
              </Link>

              <button
                type="button"
                aria-label="Open search"
                onClick={() => openSearchOverlay()}
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={mobileSheetOpen}
                aria-controls="mobile-bottom-sheet"
                onClick={() => setMobileSheetOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              aria-hidden
            />
            <motion.div
              key="sheet"
              id="mobile-bottom-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card shadow-lift md:hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pb-1 pt-3">
                <span aria-hidden className="h-1.5 w-12 rounded-full bg-muted" />
              </div>

              <div className="flex items-center justify-between border-b border-border/60 px-5 pb-3">
                <p className="font-display text-base font-semibold">Menu</p>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-1 p-3" aria-label="Mobile primary">
                {NAV_LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href as never}
                      onClick={() => setMobileSheetOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      {link.label}
                      {active && (
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border/60 p-4">
                <CredibleSearch variant="lg" onResultClick={() => setMobileSheetOpen(false)} />
              </div>

              <div className="border-t border-border/60 p-4">
                <Link
                  href={'/submit-review' as never}
                  onClick={() => setMobileSheetOpen(false)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <PenLine className="h-4 w-4" />
                  Write a Review
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
