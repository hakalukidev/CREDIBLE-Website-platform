'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import type { UserRole } from '@credible/types';

interface RequireAuthProps {
  children: ReactNode;
  role?: UserRole | UserRole[];
  fallback?: ReactNode;
}

/**
 * Wraps a subtree in a client-side auth guard. Renders `fallback` (or a
 * minimal loading state) while waiting for the session, redirects to
 * `/login` if no user, and to `/` if the role doesn't match.
 *
 * `role` accepts a single role or an array of roles — if the user's
 * role matches any of the provided roles, access is granted.
 */
export function RequireAuth({ children, role, fallback }: RequireAuthProps) {
  const { isReady, isAuthorised } = useRequireAuth({ role });

  if (!isReady) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        </div>
      )
    );
  }

  if (!isAuthorised) return null;
  return <>{children}</>;
}