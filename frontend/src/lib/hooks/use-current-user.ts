'use client';

import { useSession } from '@/lib/store/session';
import type { AuthSession, UserRole } from '@credible/types';

/**
 * Returns the currently logged-in user (or null when nobody is signed in).
 * Re-renders whenever the persisted session changes.
 */
export function useCurrentUser(): AuthSession['user'] | null {
  return useSession((s) => s.session?.user ?? null);
}

/**
 * Same as `useCurrentUser`, but also indicates whether the active session has
 * the given role. Useful for client-side route guards.
 */
export function useCurrentUserRole(requiredRole?: UserRole): {
  user: AuthSession['user'] | null;
  role: UserRole | null;
  hasRole: boolean;
} {
  const user = useCurrentUser();
  const role = (user?.role as UserRole | undefined) ?? null;
  const hasRole = !requiredRole || role === requiredRole;
  return { user, role, hasRole };
}