'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  ArrowRight,
  Building2,
  Clock,
  Star,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * "Check if it's Credible" search field — the primary hero interaction.
 *
 * Three visual variants per spec:
 *  - `lg` (default) — pill, 44px height, ⌘K hint badge, full dropdown
 *  - `md`           — compact pill, 36px, used inside the floating menu
 *  - `icon`         — just the search icon button (mobile trigger)
 *
 * Behaviour:
 *  - Focus opens dropdown. ⌘K / Ctrl+K from anywhere focuses the input.
 *  - Escape closes the dropdown.
 *  - Typing filters suggestions debounced at 250ms.
 *  - Enter submits → /search?q=...
 */

export type CredibleSearchVariant = 'lg' | 'md' | 'icon';

export interface CredibleSearchProps {
  variant?: CredibleSearchVariant;
  className?: string;
  initialQuery?: string;
  /** External open trigger (for the mobile search overlay wiring). */
  autoFocus?: boolean;
  /** Callback fired when the user submits / selects a result. */
  onResultClick?: () => void;
}

interface Suggestion {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  type: 'business' | 'category' | 'professional' | 'prompt';
  verified?: boolean;
  rating?: number;
}

const PROMPTS: Suggestion[] = [
  { id: 'p1', label: 'Is Zenith Bank credible?', subtitle: 'Quick verification', href: '/search?q=zenith+bank', type: 'prompt' },
  { id: 'p2', label: 'Top-rated restaurants near me', subtitle: 'Quick verification', href: '/search?q=restaurants', type: 'prompt' },
  { id: 'p3', label: 'Best dentists in Gulshan', subtitle: 'Quick verification', href: '/search?q=dentist', type: 'prompt' },
];

const TRENDING_BUSINESSES: Suggestion[] = [
  { id: 'b1', label: 'Zenith Bank', subtitle: 'Banking', href: '/browse/zenith-bank', type: 'business', verified: true, rating: 4.8 },
  { id: 'b2', label: 'Helix Cloud', subtitle: 'Technology', href: '/browse/helix-cloud', type: 'business', verified: true, rating: 4.9 },
  { id: 'b3', label: 'Saffron & Stone', subtitle: 'Restaurant', href: '/browse/saffron-stone', type: 'business', verified: true, rating: 4.7 },
  { id: 'b4', label: 'Northbay Clinic', subtitle: 'Healthcare', href: '/browse/northbay-clinic', type: 'business', verified: true, rating: 4.6 },
];

const TRENDING_CATEGORIES: Suggestion[] = [
  { id: 'c1', label: 'Banks', subtitle: '12,400+ verified', href: '/browse?category=banking', type: 'category' },
  { id: 'c2', label: 'Restaurants', subtitle: '8,200+ verified', href: '/browse?category=restaurants', type: 'category' },
  { id: 'c3', label: 'IT & Software', subtitle: '5,400+ verified', href: '/browse?category=technology', type: 'category' },
  { id: 'c4', label: 'Healthcare', subtitle: '3,800+ verified', href: '/browse?category=healthcare', type: 'category' },
];

// Mock "recent" history (would come from localStorage in production).
const RECENT = ['helix cloud', 'zenith bank', 'mela kitchen'];

export function CredibleSearch({
  variant = 'lg',
  className,
  initialQuery = '',
  autoFocus = false,
  onResultClick,
}: CredibleSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [value, setValue] = React.useState(initialQuery);
  const [debouncedValue, setDebouncedValue] = React.useState(initialQuery);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Debounce typing to simulate a server fetch.
  React.useEffect(() => {
    if (!value) {
      setDebouncedValue('');
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      setDebouncedValue(value);
      // Mock async — instant in this demo.
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  // Global ⌘K / Ctrl+K focuses the input.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close on outside click.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Build filtered list — when typing, filter businesses + categories by needle.
  const filteredBusinesses = React.useMemo(() => {
    if (!debouncedValue) return [];
    const needle = debouncedValue.toLowerCase();
    return TRENDING_BUSINESSES.filter((b) => b.label.toLowerCase().includes(needle));
  }, [debouncedValue]);

  const filteredCategories = React.useMemo(() => {
    if (!debouncedValue) return [];
    const needle = debouncedValue.toLowerCase();
    return TRENDING_CATEGORIES.filter((c) => c.label.toLowerCase().includes(needle));
  }, [debouncedValue]);

  // Flat list for keyboard navigation — used to compute active index.
  const flatList = React.useMemo<Suggestion[]>(() => {
    if (debouncedValue) {
      return [...filteredBusinesses, ...filteredCategories];
    }
    return [
      ...PROMPTS,
      ...TRENDING_BUSINESSES.slice(0, 3),
      ...TRENDING_CATEGORIES.slice(0, 3),
    ];
  }, [debouncedValue, filteredBusinesses, filteredCategories]);

  // Reset active index when results change.
  React.useEffect(() => {
    setActiveIdx(0);
  }, [debouncedValue]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (flatList[activeIdx] && open) {
      router.push(flatList[activeIdx].href as never);
    } else if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}` as never);
    } else {
      router.push('/search' as never);
    }
    setOpen(false);
    setFocused(false);
    onResultClick?.();
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  // Detect Mac vs Windows for the ⌘K hint badge.
  const isMac = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad/.test(navigator.platform);
  }, []);

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label="Open search"
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
          className,
        )}
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  const isLg = variant === 'lg';

  return (
    <div
      ref={wrapperRef}
      className={cn('relative w-full', className)}
      data-variant={variant}
      data-focused={focused}
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, scale: 0.96, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'group relative flex w-full items-center rounded-full transition-all duration-200',
          'credible-search-field',
          isLg
            ? 'h-11 sm:h-11'
            : 'h-9',
        )}
      >
        <Search
          aria-hidden
          className={cn(
            'ml-3.5 shrink-0 text-muted-foreground/80 transition-colors group-focus-within:text-primary',
            isLg ? 'h-4 w-4 sm:h-[18px] sm:w-[18px]' : 'h-4 w-4',
          )}
        />
        <input
          ref={inputRef}
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Check if it's Credible"
          aria-label="Check if a business is credible"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'h-full flex-1 bg-transparent px-2.5 text-foreground placeholder:italic placeholder:text-muted-foreground/80 outline-none',
            isLg
              ? 'text-sm font-medium sm:text-[15px]'
              : 'text-sm font-medium',
          )}
        />

        {!isLg && (
          <button
            type="submit"
            aria-label="Search"
            className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.form>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-2 shadow-mega',
            )}
            role="listbox"
          >
            {/* Loading skeleton when debounced fetch is "in flight" */}
            {loading && debouncedValue && (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </div>
            )}

            {/* Typing → live results */}
            {debouncedValue && !loading && (
              <>
                {filteredBusinesses.length > 0 && (
                  <SuggestionGroup label="Businesses" delay={0}>
                    {filteredBusinesses.map((b, i) => (
                      <SuggestionRow
                        key={b.id}
                        item={b}
                        active={flatList.indexOf(b) === activeIdx}
                        onHover={() => setActiveIdx(flatList.indexOf(b))}
                        onSelect={() => {
                          router.push(b.href as never);
                          setOpen(false);
                          onResultClick?.();
                        }}
                        delay={i * 0.05}
                      />
                    ))}
                  </SuggestionGroup>
                )}

                {filteredCategories.length > 0 && (
                  <SuggestionGroup label="Categories" delay={0.05}>
                    {filteredCategories.map((c, i) => (
                      <SuggestionRow
                        key={c.id}
                        item={c}
                        active={flatList.indexOf(c) === activeIdx}
                        onHover={() => setActiveIdx(flatList.indexOf(c))}
                        onSelect={() => {
                          router.push(c.href as never);
                          setOpen(false);
                          onResultClick?.();
                        }}
                        delay={i * 0.05}
                      />
                    ))}
                  </SuggestionGroup>
                )}

                {filteredBusinesses.length === 0 && filteredCategories.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No matches for &ldquo;{debouncedValue}&rdquo;. Press Enter to search anyway.
                  </p>
                )}
              </>
            )}

            {/* Idle → show recent + prompts + trending */}
            {!debouncedValue && (
              <>
                <SuggestionGroup label="Try asking" delay={0}>
                  {PROMPTS.map((p, i) => (
                    <SuggestionRow
                      key={p.id}
                      item={p}
                      active={flatList.indexOf(p) === activeIdx}
                      onHover={() => setActiveIdx(flatList.indexOf(p))}
                      onSelect={() => {
                        setValue(p.label);
                        router.push(p.href as never);
                        setOpen(false);
                        onResultClick?.();
                      }}
                      delay={i * 0.05}
                    />
                  ))}
                </SuggestionGroup>

                {RECENT.length > 0 && (
                  <>
                    <div className="my-1.5 border-t border-border/60" />
                    <SuggestionGroup label="Recent searches" delay={0.05}>
                      {RECENT.map((r, i) => (
                        <SuggestionRow
                          key={`recent-${i}`}
                          item={{
                            id: `r-${i}`,
                            label: r,
                            href: `/search?q=${encodeURIComponent(r)}`,
                            type: 'prompt',
                          }}
                          icon={<Clock className="h-3.5 w-3.5" />}
                          active={false}
                          onHover={() => undefined}
                          onSelect={() => {
                            setValue(r);
                            router.push(`/search?q=${encodeURIComponent(r)}` as never);
                            setOpen(false);
                            onResultClick?.();
                          }}
                          delay={i * 0.05}
                        />
                      ))}
                    </SuggestionGroup>
                  </>
                )}

                <div className="my-1.5 border-t border-border/60" />

                <SuggestionGroup label="Trending businesses" delay={0.1}>
                  {TRENDING_BUSINESSES.slice(0, 3).map((b, i) => (
                    <SuggestionRow
                      key={b.id}
                      item={b}
                      active={flatList.indexOf(b) === activeIdx}
                      onHover={() => setActiveIdx(flatList.indexOf(b))}
                      onSelect={() => {
                        router.push(b.href as never);
                        setOpen(false);
                        onResultClick?.();
                      }}
                      delay={i * 0.05}
                    />
                  ))}
                </SuggestionGroup>

                <div className="my-1.5 border-t border-border/60" />

                <SuggestionGroup label="Quick categories" delay={0.15}>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    {TRENDING_CATEGORIES.slice(0, 4).map((c, i) => (
                      <Link
                        key={c.id}
                        href={c.href as never}
                        onClick={() => {
                          setOpen(false);
                          onResultClick?.();
                        }}
                        className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <span className="flex-1">
                          <span className="block font-semibold text-foreground">{c.label}</span>
                          <span className="block text-[10px] text-muted-foreground">{c.subtitle}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </SuggestionGroup>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionGroup({
  label,
  delay = 0,
  children,
}: {
  label: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </motion.div>
  );
}

function SuggestionRow({
  item,
  active,
  onHover,
  onSelect,
  delay = 0,
  icon,
}: {
  item: Suggestion;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
  delay?: number;
  icon?: React.ReactNode;
}) {
  const isPrompt = item.type === 'prompt';
  return (
    <li>
      <motion.button
        type="button"
        onMouseEnter={onHover}
        onClick={onSelect}
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, delay, ease: [0.22, 1, 0.36, 1] }}
        aria-selected={active}
        className={cn(
          'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
          active ? 'bg-primary/10' : 'hover:bg-muted/70',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary',
          )}
          aria-hidden
        >
          {icon ?? (isPrompt ? <Sparkles className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
            {item.label}
            {item.verified && (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-success" aria-label="Verified" />
            )}
          </span>
          {item.subtitle && (
            <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
          )}
        </span>

        {typeof item.rating === 'number' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-gold-700">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            {item.rating.toFixed(1)}
          </span>
        )}

        <ArrowRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-all',
            active ? 'translate-x-0 text-primary opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
          )}
          aria-hidden
        />
      </motion.button>
    </li>
  );
}
