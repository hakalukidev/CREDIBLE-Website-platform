import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date, locale = 'en-BD'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

export function formatRelative(input: string | Date, locale = 'en'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diff < 60) return rtf.format(-Math.round(diff), 'second');
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 86400 * 7) return rtf.format(-Math.round(diff / 86400), 'day');
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}