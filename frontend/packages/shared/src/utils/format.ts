export function formatCurrency(amount: number | string, currency = 'BDT', locale = 'en-BD'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function formatRating(value: number | string | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

export function truncate(text: string, max = 200): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export function initials(first?: string | null, last?: string | null): string {
  const f = (first ?? '').trim().charAt(0);
  const l = (last ?? '').trim().charAt(0);
  return (f + l).toUpperCase() || '?';
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  const masked = user.length <= 2 ? user[0] + '*' : user[0] + '***' + user.slice(-1);
  return `${masked}@${domain}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function formatRelative(input: string | Date | number, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = now.getTime() - date.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (abs < minute) return future ? 'in a moment' : 'just now';
  if (abs < hour) {
    const v = Math.round(abs / minute);
    return future ? `in ${v}m` : `${v}m ago`;
  }
  if (abs < day) {
    const v = Math.round(abs / hour);
    return future ? `in ${v}h` : `${v}h ago`;
  }
  if (abs < week) {
    const v = Math.round(abs / day);
    return future ? `in ${v}d` : `${v}d ago`;
  }
  // Beyond a week: show absolute date.
  return date.toLocaleDateString();
}