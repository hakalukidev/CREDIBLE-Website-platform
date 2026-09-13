'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSession } from '@/lib/admin/admin-session';

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side guard for the hidden admin surface. Reads the *dedicated* admin
 * session (never the public user session) and redirects to `/admin/login` when
 * it is missing. Also reacts to `credible:admin-unauthorized` (fired by the
 * API client when an admin endpoint answers 401) by clearing the admin session
 * and bouncing to the gateway, leaving any public session untouched.
 */
export function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const session = useAdminSession((s) => s.session);
  const clear = useAdminSession((s) => s.clear);
  const router = useRouter();

  useEffect(() => {
    function onUnauthorized() {
      clear();
      const next = window.location.pathname + window.location.search;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}` as never);
    }
    window.addEventListener('credible:admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('credible:admin-unauthorized', onUnauthorized);
  }, [clear, router]);

  if (!session) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Redirecting to admin gateway…</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}