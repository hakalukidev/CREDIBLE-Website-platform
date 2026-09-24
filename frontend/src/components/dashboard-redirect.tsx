'use client';

/**
 * DashboardRedirect — replaces the old `/dashboard/*` general-user
 * pages (overview, reviews, businesses, register) with a single,
 * server-driven redirect to the equivalent profile surface.
 *
 * Resolution:
 *   - If the viewer is signed in, fetch `/users/me` to get the
 *     canonical `username` (preferred) / `slug` / `id` handle, then
 *     push to the target URL with the optional hash deep-link.
 *   - If the viewer isn't signed in, push to `/login?next=…` so the
 *     original URL is preserved across the auth round-trip.
 *
 * `target` is a function so the caller can compose the destination
 * (e.g. `'/profile/' + handle + '#reviews'`) without the component
 * knowing about every old route.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { apiClient } from '@/lib/api/client';

export interface DashboardRedirectProps {
  /**
   * Path + hash to send signed-in users to. Accepts either a static
   * string (for routes that don't depend on the user, e.g. the
   * register page) or a function that receives the resolved handle
   * (used by `/profile/[username]#reviews` style destinations).
   */
  target: string | ((handle: string) => string);
  /**
   * If true, an unauthenticated visitor is sent straight to
   * `/profile/register` so the register flow never bounces through
   * the login screen first. Default: false (redirect to /login).
   */
  bypassAuthForRegister?: boolean;
}

interface MeUser {
  id: string;
  username?: string | null;
  slug?: string | null;
}

export function DashboardRedirect({
  target,
  bypassAuthForRegister,
}: DashboardRedirectProps) {
  const router = useRouter();
  const user = useCurrentUser();

  useEffect(() => {
    if (!user) {
      if (bypassAuthForRegister) {
        router.replace('/profile/register' as never);
        return;
      }
      const next =
        typeof window !== 'undefined'
          ? encodeURIComponent(window.location.pathname + window.location.search)
          : '';
      router.replace(
        (`/login${next ? `?next=${next}` : ''}` as never) as never,
      );
      return;
    }

    // Static target → no need to fetch /users/me.
    if (typeof target === 'string') {
      router.replace(target as never);
      return;
    }

    let cancelled = false;
    apiClient
      .get<{ success: true; data: MeUser }>('/users/me')
      .then((res) => {
        if (cancelled) return;
        const me = res.data.data;
        // Prefer the human-friendly username, fall back to slug, then the
        // raw cuid so users without a handle still get redirected to a
        // valid profile URL (the backend resolves ids too).
        const handle = me.username || me.slug || me.id;
        router.replace(target(handle) as never);
      })
      .catch(() => {
        // If `/users/me` fails, treat the session as stale.
        if (cancelled) return;
        router.replace('/login' as never);
      });

    return () => {
      cancelled = true;
    };
  }, [user, target, bypassAuthForRegister, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
}
