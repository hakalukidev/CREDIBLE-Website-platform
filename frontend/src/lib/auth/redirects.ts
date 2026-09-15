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
      return '/';
  }
}

/** Auth screens that a fresh session must never be sent back to —
 *  landing there would immediately re-trigger the sign-in flow. */
const AUTH_SCREEN_PATHS = ['/login', '/register', '/forgot-password', '/admin/login'];

function pathOf(value: string): string {
  return value.split(/[?#]/, 1)[0];
}

/** True when `value` is a plausible post-auth destination — a plain
 *  same-origin path that isn't itself an auth screen. */
function isSafeDestination(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  return !AUTH_SCREEN_PATHS.includes(pathOf(value));
}

/** Origin guard. Unlike `?next=…`, the page the user came from must
 *  never resolve into the admin console — that area auto-guards anyway,
 *  and a stray origin could otherwise bounce a regular user about. */
function isSafeOrigin(value: string): boolean {
  if (!isSafeDestination(value)) return false;
  const path = pathOf(value);
  return !(path === '/admin' || path.startsWith('/admin/'));
}

/**
 * Post-auth landing URL. Resolution order:
 *   1. A same-origin `?next=…` deep link (explicit intent).
 *   2. `origin` — the page the user was on when they triggered sign-in,
 *      so closing the auth modal drops them back where they were.
 *   3. The role-appropriate home for a sensible default.
 *
 * Only same-origin paths are honoured — anything else is dropped to the
 * role default to avoid open-redirect abuse, and auth screens are
 * excluded so a fresh session never loops back into login.
 *
 * `search` accepts anything with a `get()` method, so the helper
 * works with both `URLSearchParams` and Next's `useSearchParams()`.
 * `adminOnly` is for the admin sign-in page — when set, only an ADMIN
 * role is allowed through to `?next=`, the `origin` fallback is
 * ignored, and everyone else gets bounced to `/admin` (or `/` if no
 * session is present yet).
 */
export function postAuthRedirect(
  search: { get(name: string): string | null } | null,
  role: string,
  options: { adminOnly?: boolean; origin?: string } = {},
): string {
  const next = search?.get('next') ?? '';
  if (isSafeDestination(next) && (!options.adminOnly || role === 'ADMIN')) return next;
  if (options.adminOnly) return role === 'ADMIN' ? '/admin' : '/';

  const origin = options.origin ?? '';
  if (isSafeOrigin(origin)) return origin;

  return homeForRole(role);
}
