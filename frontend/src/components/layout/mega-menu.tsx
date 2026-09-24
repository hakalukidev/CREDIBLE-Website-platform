'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable mega-menu / dropdown panel.
 *
 * Hover- or click-triggered. Animation: fade + translateY(8px → 0), 200ms.
 * Closes on outside click, Escape, or on selection (caller can opt-out).
 *
 * The trigger element must accept a `ref` and a `className`. We pass
 * `aria-haspopup` and `aria-expanded` for screen readers automatically.
 *
 * Variants:
 *  - `lg`  (default) — large panel with shadow-mega, used for nav items
 *  - `md`            — compact panel, used for sub-menus (avatar, etc.)
 */

interface MegaMenuProps {
  trigger: (props: { open: boolean; ariaProps: Record<string, unknown> }) => React.ReactNode;
  children: (ctx: { close: () => void }) => React.ReactNode;
  /** Alignment of the panel relative to the trigger. Default: `left`. */
  align?: 'left' | 'right' | 'center';
  /** Visual size of the panel. Default: `lg`. */
  size?: 'lg' | 'md';
  /** Open mode. Default: hover (with click fallback). Pass `'click'` to force click. */
  triggerMode?: 'hover' | 'click';
  /** Width class override (e.g. `'w-[480px]'`). Default: auto. */
  widthClass?: string;
  /** Optional className on the outer container. */
  className?: string;
}

export function MegaMenu({
  trigger,
  children,
  align = 'left',
  size = 'lg',
  triggerMode = 'hover',
  widthClass,
  className,
}: MegaMenuProps) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Close on outside click.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const ariaProps = {
    'aria-haspopup': true as const,
    'aria-expanded': open,
  };

  return (
    <div
      ref={wrapperRef}
      className={cn('relative', className)}
      onMouseEnter={triggerMode === 'hover' ? () => { cancelClose(); setOpen(true); } : undefined}
      onMouseLeave={triggerMode === 'hover' ? scheduleClose : undefined}
    >
      <div
        onClick={
          triggerMode === 'click'
            ? () => setOpen((v) => !v)
            : () => setOpen(true)
        }
      >
        {trigger({ open, ariaProps })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={triggerMode === 'hover' ? cancelClose : undefined}
            onMouseLeave={triggerMode === 'hover' ? scheduleClose : undefined}
            role="menu"
            className={cn(
              'absolute top-full z-50 mt-2 origin-top overflow-hidden rounded-2xl border border-border/80 bg-card shadow-mega',
              align === 'left' && 'left-0',
              align === 'right' && 'right-0',
              align === 'center' && 'left-1/2 -translate-x-1/2',
              size === 'lg' ? 'p-5' : 'p-3',
              widthClass,
            )}
          >
            {children({ close: () => setOpen(false) })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Helper for the "trigger button" shape — text + chevron, animated open state.
 */
export function MegaMenuTriggerLabel({
  label,
  open,
  hasChevron = true,
  className,
  ariaProps,
}: {
  label: string;
  open: boolean;
  hasChevron?: boolean;
  className?: string;
  ariaProps?: Record<string, unknown>;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      {...(ariaProps ?? {})}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        open
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {label}
      {hasChevron && (
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      )}
    </span>
  );
}
