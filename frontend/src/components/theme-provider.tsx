'use client';

/**
 * Local theme provider — replaces `next-themes`.
 *
 * Why we rolled our own instead of using `next-themes`:
 *
 * `next-themes` v0.4.x renders an inline `<script dangerouslySetInnerHTML>`
 * JSX node inside `ThemeProvider` to apply the stored theme class before
 * paint. Under Next.js 16 (Turbopack) + React 19, that JSX is treated as
 * "rendering a <script> tag from a React component", which the dev server
 * reports as:
 *
 *   "Encountered a script tag while rendering React component. ... Consider
 *    using template tag instead."
 *
 * Doing the pre-paint work in `layout.tsx` (a server component) as a real
 * `<script>` tag avoids that diagnostic without changing behaviour — Next.js
 * emits the static HTML as-is for a server component `<script>`, and the
 * React runtime never sees the JSX.
 *
 * Theme resolution: light | dark | system. The pre-paint boot script in
 * `layout.tsx` reads the stored preference (defaulting to the OS level),
 * applies the matching class, and this provider keeps the two in sync on
 * subsequent `setTheme()` calls and OS preference changes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (next: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.(`(prefers-color-scheme: dark)`).matches === true
  );
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* localStorage may be blocked (private mode, SSR) — fall through. */
  }
  return 'system';
}

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme === 'dark' ? 'dark' : 'light';
}

function applyClass(theme: Theme): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  const resolved = resolve(theme);
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    setResolvedTheme(applyClass(stored));

    // Follow OS preference changes when the user is on `system`.
    const mq = window.matchMedia(`(prefers-color-scheme: dark)`);
    const onChange = () => {
      setThemeState((current) => {
        if (current !== 'system') return current;
        setResolvedTheme(applyClass('system'));
        return current;
      });
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolvedTheme(applyClass(next));
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage write may be blocked — non-fatal, the effect on remount will retry. */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback when used outside the provider (e.g. a story or test). Returning
    // a no-op keeps the call site valid without forcing every consumer to
    // branch on `undefined`.
    return {
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: () => undefined,
    };
  }
  return ctx;
}
