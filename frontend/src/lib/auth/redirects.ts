// lib/auth/redirects.ts
//
// Shared auth helpers used by the login and register pages — kept
// here so any new auth screen stays consistent.

/**
 * URL a freshly-authenticated user should land on, by role. The bare
 * `/` is intentionally the CUSTOMER landing page (the marketing /
 * discovery home). Other roles jump to their own dashboard so the
 * user can keep working where they left off.
 *
 * Accepts `string` rather than `UserRole` because the persisted
 * `AuthSession.user.role` is typed as `string` — narrowing here keeps
 * the helper drop-in for both fresh payloads and stale persisted ones.
 */
export function homeForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'BUSINESS':
      return '/business/dashboard';
    case 'PROFESSIONAL':
      return '/professional/dashboard';
    case 'CUSTOMER':
    case 'GUEST':
    default:
      return '/dashboard/profile';
  }
}

/**
 * Post-auth landing URL when an inbound deep link (`?next=…`) is
 * present. Falls back to the role-appropriate home so unauthenticated
 * visitors without a `next` still get sensible defaults. Only same-
 * origin paths are honoured — anything else is dropped to the role
 * default to avoid open-redirect abuse.
 *
 * `search` accepts anything with a `get()` method, so the helper
 * works with both `URLSearchParams` and Next's `useSearchParams()`.
 * `adminOnly` is for the admin sign-in page — when set, only an ADMIN
 * role is allowed through to `?next=`, everyone else gets bounced to
 * `/admin` (or `/` if no session is present yet).
 */
export function postAuthRedirect(
  search: { get(name: string): string | null } | null,
  role: string,
  options: { adminOnly?: boolean } = {},
): string {
  const next = search?.get('next') ?? '';
  // Only allow same-origin path-only redirects.
  const safeNext = next.startsWith('/') && !next.startsWith('//');
  if (safeNext && (!options.adminOnly || role === 'ADMIN')) return next;
  if (options.adminOnly) return role === 'ADMIN' ? '/admin' : '/';
  return homeForRole(role);
}
