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
 * The site is locked to the **light** theme. This provider still keeps the
 * stored preference in localStorage so a future toggle can re-honor it, but
 * `applyClass()` always resolves to `light` and never toggles the `dark`
 * class onto <html>. Dark-mode tokens are kept in `globals.css` for any
 * future opt-in but are not active today.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (next: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

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

function applyClass(theme: Theme): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  // The site is locked to the light theme. Even if the user has set their
  // OS to dark or explicitly selected "dark" in the past, we resolve to
  // light so the page never flips to a dark surface. We still clear the
  // `dark` class so any future toggle can re-engage it cleanly.
  const resolved: 'light' | 'dark' = 'light';
  root.classList.toggle('dark', false);
  // Keep colorScheme in sync with the resolved value so form controls,
  // scrollbars, and the browser UI match the rendered surface.
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start as 'light' on the server so SSR and client agree; the
  // actual stored value is read in the effect below.
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    setResolvedTheme(applyClass(stored));
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
