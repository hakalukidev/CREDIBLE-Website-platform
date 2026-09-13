import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Dedicated admin session. Kept fully separate from the public user session
 * (`useSession`): an admin who logs in while a customer is signed still has
 * two independent sessions, and logging out of one never touches the other.
 */

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AdminSession {
  user: AdminUser;
  token: string;
  expiresIn: number;
  /** Epoch ms when the token was issued (for inactivity/expiry timers). */
  acquiredAt: number;
}

interface AdminSessionState {
  session: AdminSession | null;
  setSession: (s: AdminSession) => void;
  clear: () => void;
}

const STORAGE_KEY = 'credible-admin-session';

export const useAdminSession = create<AdminSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (s) => set({ session: s }),
      clear: () => set({ session: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
);

/** Imperative accessor for non-React code (e.g. axios interceptors). */
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { state?: { session?: AdminSession | null } }).state?.session ?? null;
  } catch {
    return null;
  }
}

/** Admin session has fully expired (token lifetime exceeded). */
export function isAdminSessionExpired(session: AdminSession, now = Date.now()): boolean {
  return now - session.acquiredAt >= session.expiresIn * 1000;
}