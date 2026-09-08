// lib/auth/refresh-session-user.ts
//
// Centralises the "patch the user inside the persisted session" pattern.
// Used after any server response that returns a refreshed user object
// (profile update, business/professional creation that upgrades the
// role, OAuth callback, etc.) so the header dropdown and other
// role-conditional UI re-render immediately.

import { apiClient } from '@/lib/api/client';
import { useSession } from '@/lib/store/session';
import { debugWarn } from '@/lib/utils';
import type { AuthSession, AuthTokens } from '@credible/types';

type UserPatch = Partial<AuthSession['user']>;

/**
 * Patch the current session's user with the provided fields. Silently
 * no-ops if there's no active session, or the patch doesn't reference
 * the same user id (defensive — protects against stale callbacks).
 */
export function refreshSessionUser(patch: UserPatch): void {
  const state = useSession.getState();
  const session = state.session;
  if (!session) return;
  if (patch.id && patch.id !== session.user.id) return;
  state.setSession({
    ...session,
    user: { ...session.user, ...patch },
  });
}

/**
 * Swap the stored access/refresh tokens for fresh ones. The auth
 * service's `/auth/refresh` reads the user's *current* role from the
 * database, so this is how the client picks up server-side role
 * upgrades (CUSTOMER → BUSINESS / PROFESSIONAL after creating a
 * profile) without forcing the user to sign out and back in. Returns
 * the new tokens on success, or `null` if there was no session or the
 * refresh failed (the caller can still patch `user` for the UI even
 * if the token swap fails — the worst case is the next gated request
 * gets a 403 and the user re-auths).
 */
export async function refreshSessionTokens(): Promise<AuthTokens | null> {
  const state = useSession.getState();
  const session = state.session;
  if (!session?.tokens.refreshToken) return null;
  try {
    const res = await apiClient.post<{
      success: true;
      data: { tokens: AuthTokens; user?: UserPatch };
    }>('/auth/refresh', { refreshToken: session.tokens.refreshToken });
    const { tokens, user } = res.data.data;
    state.setSession({
      ...session,
      tokens,
      ...(user ? { user: { ...session.user, ...user } } : {}),
    });
    return tokens;
  } catch (err) {
    debugWarn('[refreshSessionTokens] refresh failed:', err);
    return null;
  }
}
