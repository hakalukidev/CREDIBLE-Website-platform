'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  /** Optional title shown above the list (defaults to "On this page"). */
  label?: string;
}

/**
 * Sticky in-page navigation. Highlights the section currently in view via
 * an IntersectionObserver so the user always knows where they are in a
 * long legal document. Renders nothing when there are fewer than two
 * items — a one-item TOC is noise.
 */
export function TableOfContents({ items, label = 'On this page' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length < 2 || typeof window === 'undefined') return;
    const elements = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    // Pick the topmost heading whose top has crossed the scroll offset
    // — a single scroll listener is cheaper than an IntersectionObserver
    // for a known small list and avoids the observer firing setState on
    // every no-op intersection change.
    let lastActive: string | null = items[0]?.id ?? null;
    const compute = () => {
      const scrollY = window.scrollY + 120;
      let nextActive = lastActive;
      for (const el of elements) {
        if (el.offsetTop <= scrollY) nextActive = el.id;
        else break;
      }
      if (nextActive !== lastActive) {
        lastActive = nextActive;
        setActiveId(nextActive);
      }
    };
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    return () => window.removeEventListener('scroll', compute);
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside
      aria-label="Table of contents"
      className="sticky top-24 hidden self-start lg:block"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <nav>
        <ul className="space-y-1 border-l text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  '-ml-px block border-l py-1 pl-4 pr-2 transition-colors hover:text-foreground',
                  activeId === item.id
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
