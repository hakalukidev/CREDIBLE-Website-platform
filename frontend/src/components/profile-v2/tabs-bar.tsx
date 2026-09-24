'use client';

/**
 * ProfileTabs — WAI-ARIA tabs bar (arrow-key navigation, generic over id).
 */

import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface ProfileTabDefinition<T extends string> {
  id: T;
  label: string;
}

export interface ProfileTabsProps<T extends string> {
  tabs: ProfileTabDefinition<T>[];
  value: T;
  onChange: (next: T) => void;
  idPrefix: string;
  className?: string;
}

export function ProfileTabs<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix,
  className,
}: ProfileTabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKey(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    const last = tabs.length - 1;
    let next = idx;
    if (e.key === 'ArrowRight') next = idx === last ? 0 : idx + 1;
    else if (e.key === 'ArrowLeft') next = idx === 0 ? last : idx - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'flex w-full items-center gap-1 overflow-x-auto border-b border-border',
        className,
      )}
    >
      {tabs.map((tab, idx) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-${tab.id}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKey(e, idx)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              selected
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-opacity',
                selected ? 'bg-primary opacity-100' : 'opacity-0',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
