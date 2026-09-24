'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUI } from '@/lib/store/theme';
import { CredibleSearch } from './credible-search';

/**
 * Full-screen search overlay for mobile (<768px). Mounted once at the
 * ChromeFrame level; opened by the floating-pill Search button or the
 * bottom-nav Search tab. Slides down from the top.
 */
export function SearchOverlay() {
  const open = useUI((s) => s.searchOverlayOpen);
  const close = useUI((s) => s.closeSearchOverlay);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            aria-hidden
          />
          <motion.div
            key="overlay-panel"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="fixed inset-x-0 top-0 z-[61] rounded-b-3xl bg-card shadow-lift md:hidden"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Search
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pb-6 pt-4">
              <CredibleSearch variant="lg" autoFocus onResultClick={close} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
