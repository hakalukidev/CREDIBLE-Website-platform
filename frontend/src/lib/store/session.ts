import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '@credible/types';

interface SessionState {
  session: AuthSession | null;
  setSession: (s: AuthSession | null) => void;
  clear: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (s) => set({ session: s }),
      clear: () => set({ session: null }),
    }),
    {
      name: 'credible-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
);

/**
 * Imperative accessor for use outside React (e.g., axios interceptors).
 */
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('credible-session');
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { state?: { session?: AuthSession | null } }).state?.session ?? null;
  } catch {
    return null;
  }
}