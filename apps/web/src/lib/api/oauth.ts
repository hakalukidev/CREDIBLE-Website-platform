'use client';

import { useSession } from '@/lib/store/session';
import type { AuthSession, UserRole } from '@credible/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface OAuthProvidersResponse {
  google: boolean;
  facebook: boolean;
}

/**
 * Returns the OAuth providers currently configured on the server. The frontend
 * uses this to hide / show the social-login buttons instead of the previous
 * "disabled" state.
 */
export async function getOAuthProviders(): Promise<OAuthProvidersResponse> {
  const res = await fetch(`${API_URL}/auth/oauth/providers`, {
    credentials: 'include',
  });
  if (!res.ok) return { google: false, facebook: false };
  const json = (await res.json()) as { success: true; data: OAuthProvidersResponse };
  return json.data;
}

/**
 * Opens a popup window pointing at the OAuth provider and waits for the
 * popup to postMessage the tokens back. Resolves with the new session, or
 * rejects with an error if the popup is closed / blocked.
 */
export function startOAuthPopup(
  provider: 'google' | 'facebook',
  options: { timeoutMs?: number } = {},
): Promise<AuthSession> {
  const { timeoutMs = 120_000 } = options;
  const url = `${API_URL}/auth/${provider}`;
  const popup = window.open(
    url,
    `credible-oauth-${provider}`,
    'width=520,height=640,menubar=no,toolbar=no,location=no,status=no',
  );

  if (!popup) {
    return Promise.reject(
      new Error(
        'Popup blocked. Please allow popups for this site to use social sign-in.',
      ),
    );
  }

  return new Promise<AuthSession>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Sign-in timed out. Please try again.'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      try {
        popup?.close();
      } catch {
        /* ignore */
      }
    }

    function handler(event: MessageEvent) {
      if (!event.data || typeof event.data !== 'object') return;
      const data = event.data as { type?: string; tokens?: { accessToken: string; refreshToken: string }; user?: { id: string; email: string; role: UserRole }; message?: string };

      if (data.type === 'credible:oauth') {
        cleanup();
        if (!data.tokens || !data.user) {
          reject(new Error('Sign-in failed: malformed response'));
          return;
        }
        const session: AuthSession = {
          tokens: {
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
          },
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
          },
        };
        resolve(session);
        return;
      }

      if (data.type === 'credible:oauth:failed') {
        cleanup();
        reject(new Error(data.message ?? 'Sign-in failed'));
      }
    }

    window.addEventListener('message', handler);

    // Detect popup-close early
    const closedCheck = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedCheck);
        cleanup();
        reject(new Error('Sign-in cancelled'));
      }
    }, 500);
  });
}

/**
 * Convenience hook that wires up the popup, persists the session, and
 * routes the user based on their role.
 */
export function useOAuthLogin() {
  const setSession = useSession((s) => s.setSession);

  return {
    /**
     * Begin OAuth login. Resolves once the popup has delivered a session
     * and we've persisted it to local storage. The caller is responsible
     * for redirecting the page (via `router.push`) afterwards.
     */
    async loginWith(provider: 'google' | 'facebook'): Promise<AuthSession> {
      const session = await startOAuthPopup(provider);
      setSession(session);
      return session;
    },
  };
}
