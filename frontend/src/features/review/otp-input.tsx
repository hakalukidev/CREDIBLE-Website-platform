'use client';

import { useEffect, useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

/**
 * 6-digit (configurable) one-time-password input with auto-focus, paste support
 * and backspace navigation. The whole value is exposed via `value` / `onChange`
 * so parent components stay simple.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  autoFocus = true,
  invalid,
  ariaLabel = 'One-time code',
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0]?.focus();
  }, [autoFocus]);

  const chars = value.padEnd(length, ' ').split('').slice(0, length);

  const setChar = (i: number, ch: string) => {
    const next = chars.slice();
    next[i] = ch;
    onChange(next.join('').replace(/\s+$/, ''));
    if (ch && refs.current[i + 1]) refs.current[i + 1]?.focus();
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    if (!digit) {
      setChar(i, '');
      return;
    }
    setChar(i, digit);
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[i]?.trim()) {
        setChar(i, '');
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setChar(i - 1, '');
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (digits) {
      e.preventDefault();
      onChange(digits);
      const lastIndex = Math.min(digits.length, length - 1);
      refs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={cn(
            'h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            invalid && 'border-destructive',
            disabled && 'opacity-60',
          )}
          value={chars[i]?.trim() ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}