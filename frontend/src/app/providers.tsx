'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { makeQueryClient } from '@/lib/api/query-client';
import { useSession } from '@/lib/store/session';
import { useUI } from '@/lib/store/theme';
import { ThemeProvider } from '@/components/theme-provider';
import { CookieConsent } from '@/components/layout/cookie-consent';
import { AuthModal } from '@/components/auth/auth-modal';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <UnauthorizedListener />
        {children}
        {/* Next 16 requires useSearchParams consumers inside a Suspense
            boundary; the modal stays hidden until `authOpen` flips so
            a null fallback is visually identical. */}
        <Suspense fallback={null}>
          <AuthModalMount />
        </Suspense>
        <Toaster richColors position="top-right" />
        <CookieConsent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Mounts the auth modal exactly once, in the root layout, so any CTA
 * across the app can open it via the `useUI` store. Also re-opens
 * the modal automatically when the user lands on `/login` or
 * `/register` directly (so those URLs stay shareable).
 */
function AuthModalMount() {
  const authOpen = useUI((s) => s.authOpen);
  const authMode = useUI((s) => s.authMode);
  const openAuth = useUI((s) => s.openAuth);
  const closeAuth = useUI((s) => s.closeAuth);
  const session = useSession((s) => s.session);
  const pathname = usePathname();

  // When the user navigates to /login or /register directly, treat it
  // as an intent to open the modal — the route becomes a thin
  // shareable URL that resolves into the same overlay.
  useEffect(() => {
    if (pathname === '/login') openAuth('signin');
    else if (pathname === '/register') openAuth('signup');
  }, [pathname, openAuth]);

  // Auto-dismiss the modal the moment a session lands — covers email
  // sign-in, signup, and OAuth round-trips. `closeAuth` is a no-op
  // when `authOpen` is already false, so this won't churn on re-renders
  // for an already-signed-in user.
  useEffect(() => {
    if (session) closeAuth();
  }, [session, closeAuth]);

  return (
    <AuthModal
      open={authOpen}
      initialMode={authMode}
      onOpenChange={(next) => {
        if (!next) {
          closeAuth();
          // If the user opened the modal via the /login or /register
          // route, drop them back to the home page so the URL doesn't
          // linger in the back stack.
          if (pathname === '/login' || pathname === '/register') {
            window.history.replaceState(null, '', '/');
          }
        }
      }}
    />
  );
}

/**
 * Listens for the `credible:unauthorized` event emitted by the axios
 * interceptor when the API rejects a request with 401, then clears the
 * client-side session and opens the sign-in modal.
 */
function UnauthorizedListener() {
  const clear = useSession((s) => s.clear);
  const openAuth = useUI((s) => s.openAuth);

  useEffect(() => {
    function handle() {
      clear();
      openAuth('signin');
    }
    window.addEventListener('credible:unauthorized', handle);
    return () => window.removeEventListener('credible:unauthorized', handle);
  }, [clear, openAuth]);

  return null;
}
