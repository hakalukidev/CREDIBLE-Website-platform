import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

export type AuthMode = 'signin' | 'signup';

interface UIState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
  /** Global auth-modal state. The modal is mounted once at the root
   *  layout; any CTA (header, mobile drawer, marketing blocks) calls
   *  `openAuth()` / `closeAuth()` to drive it. */
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (t) => set((s) => (s.theme === t ? s : { theme: t })),
      sidebarOpen: false,
      setSidebarOpen: (b) =>
        set((s) => (s.sidebarOpen === b ? s : { sidebarOpen: b })),
      authOpen: false,
      authMode: 'signin',
      openAuth: (mode = 'signin') =>
        set((s) =>
          s.authOpen && s.authMode === mode ? s : { authOpen: true, authMode: mode },
        ),
      closeAuth: () => set((s) => (s.authOpen ? { authOpen: false } : s)),
    }),
    {
      name: 'credible-ui',
      storage: createJSONStorage(() => localStorage),
      // Don't persist transient overlay state — only `theme` belongs in
      // localStorage. Otherwise a stale `authOpen: true` could surprise
      // a returning user with an instant modal on next load.
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
);
