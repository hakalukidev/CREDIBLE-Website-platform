import type { BusinessDayKey, BusinessHoursEntry, BusinessHoursJson } from '@/types/business';

export const DAY_ORDER: readonly BusinessDayKey[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DAY_LABELS: Record<BusinessDayKey, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

export function dayLabel(day: BusinessDayKey): string {
  return DAY_LABELS[day];
}

/**
 * Convert a `Date` to our 3-letter day key. Uses UTC getters so server and
 * client agree on which "today" is — the user's local timezone is irrelevant
 * for the table layout; the open-now badge uses minutes-since-midnight which
 * already encodes timezone.
 */
export function dayKeyForDate(date: Date): BusinessDayKey {
  // JS getUTCDay: 0=Sun..6=Sat → map to MON..SUN starting at MON.
  const u = date.getUTCDay();
  const map: BusinessDayKey[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return map[u];
}

export function todayKey(): BusinessDayKey {
  return dayKeyForDate(new Date());
}

export function getEntry(
  hours: BusinessHoursJson | undefined,
  day: BusinessDayKey,
): BusinessHoursEntry | undefined {
  return hours?.[day];
}

/** "09:30" → 570 minutes. Returns NaN on bad input. */
function hhmmToMinutes(value: string | undefined): number {
  if (!value) return NaN;
  const [h, m] = value.split(':').map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function nowMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export type OpenStatus = {
  isOpen: boolean;
  /** True if the business has any hours configured at all. */
  hasHours: boolean;
};

/**
 * Returns whether the business is open at `now`. A day is "open" if
 * `closed === false` and `nowMinutes` is within `[open, close)`. Overnight
 * spans (close < open) are supported — they wrap to the next day.
 */
export function isOpenNow(hours: BusinessHoursJson | undefined, now: Date = new Date()): OpenStatus {
  const day = todayKey();
  const entry = getEntry(hours, day);
  if (!entry) return { isOpen: false, hasHours: false };
  if (entry.closed) return { isOpen: false, hasHours: true };
  const open = hhmmToMinutes(entry.open);
  const close = hhmmToMinutes(entry.close);
  if (Number.isNaN(open) || Number.isNaN(close)) return { isOpen: false, hasHours: true };
  const t = nowMinutes(now);
  // Overnight: close < open → treat the window as wrapping past midnight.
  if (close <= open) {
    return { isOpen: t >= open || t < close, hasHours: true };
  }
  return { isOpen: t >= open && t < close, hasHours: true };
}

/** "HH:mm" → "9:30 AM". Falls back to the raw value on bad input. */
export function formatTime(value: string | undefined): string {
  if (!value) return '';
  const [hStr, mStr] = value.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const period = h >= 12 ? 'PM' : 'AM';
  const display = ((h + 11) % 12) + 1;
  return `${display}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatRange(entry: BusinessHoursEntry | undefined): string {
  if (!entry) return 'Closed';
  if (entry.closed) return 'Closed';
  if (!entry.open || !entry.close) return 'Closed';
  return `${formatTime(entry.open)} – ${formatTime(entry.close)}`;
}