'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from './header';
import { SiteFooter } from './footer';

interface ChromeFrameProps {
  children: ReactNode;
}

/**
 * Wraps the page body with the global `<SiteHeader />` and `<SiteFooter />`,
 * but omits them on routes that own their own chrome — currently `/dashboard/*`,
 * whose `DashboardShell` already provides its own header (sidebar brand +
 * collapsible toggle) and doesn't need the marketing header / footer stack.
 *
 * Kept as a thin client component because Next.js App Router root layouts are
 * server components and `usePathname()` is the cheapest, most-reliable signal
 * for the active route. The skip link (`#main-content`) still resolves because
 * we keep the same `<main id="main-content">` element this component renders.
 */
export function ChromeFrame({ children }: ChromeFrameProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;

  return (
    <>
      {!isDashboard && <SiteHeader />}
      <main id="main-content" className="min-h-[60vh]" tabIndex={-1}>
        {children}
      </main>
      {!isDashboard && <SiteFooter />}
    </>
  );
}
