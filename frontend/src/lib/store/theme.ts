import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (t) => set({ theme: t }),
      sidebarOpen: false,
      setSidebarOpen: (b) => set({ sidebarOpen: b }),
    }),
    {
      name: 'credible-ui',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);