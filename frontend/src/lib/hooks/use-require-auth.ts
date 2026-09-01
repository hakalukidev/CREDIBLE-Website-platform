'use client';

import { useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from './use-current-user';
import type { UserRole } from '@credible/types';

interface UseRequireAuthOptions {
  role?: UserRole;
  redirectTo?: string;
}

/**
 * Client-side route guard hook. While the session is being read from storage,
 * returns `isReady: false`. Once read, redirects to `/login` (or the supplied
 * path) if no user is signed in, or to `/` if a role is required and doesn't
 * match.
 */
export function useRequireAuth(opts: UseRequireAuthOptions = {}) {
  const { role, redirectTo = '/login' } = opts;
  const user = useCurrentUser();
  const router = useRouter();

  const isReady = true; // session store is synchronous from localStorage
  const missingUser = !user;
  const roleMismatch = Boolean(role && user && user.role !== role);

  useEffect(() => {
    if (missingUser) {
      const next =
        typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '';
      // `redirectTo` + an appended `?next=` query string isn't a route Next's
      // typedRoutes generator can statically verify; it's caller-supplied and
      // intentionally dynamic.
      router.replace(`${redirectTo}${next ? `?next=${next}` : ''}` as Route);
      return;
    }
    if (roleMismatch) {
      router.replace('/');
    }
  }, [missingUser, roleMismatch, redirectTo, router]);

  return {
    user,
    isReady,
    isAuthorised: !missingUser && !roleMismatch,
  };
}