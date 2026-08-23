export const USER_ROLES = ['GUEST', 'CUSTOMER', 'BUSINESS', 'ADMIN'] as const;

export const REVIEW_EDIT_WINDOW_HOURS = 24;
export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;
export const REVIEW_MAX_CONTENT_LENGTH = 4000;
export const REVIEW_MIN_CONTENT_LENGTH = 10;
export const REVIEW_MAX_TITLE_LENGTH = 120;

export const BUSINESS_NAME_MIN_LENGTH = 2;
export const BUSINESS_NAME_MAX_LENGTH = 120;
export const BUSINESS_DESCRIPTION_MAX_LENGTH = 2000;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const REVIEW_FLAG_REASONS = [
  'SPAM',
  'OFFENSIVE',
  'FAKE',
  'IRRELEVANT',
  'CONFLICT_OF_INTEREST',
  'OTHER',
] as const;

export type ReviewFlagReason = (typeof REVIEW_FLAG_REASONS)[number];

/**
 * Days of the week used by Business operating-hours editor.
 */
export const BUSINESS_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type BusinessDay = (typeof BUSINESS_DAYS)[number];

export const BUSINESS_DAY_LABELS: Record<BusinessDay, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

/**
 * OTP-related constants.
 * - OTP_RESEND_COOLDOWN_SECONDS is the minimum gap between two OTP requests
 *   for the same identifier (enforced client-side; the server enforces a
 *   separate per-IP rate limit).
 * - REVIEW_OTP_LENGTH is the length of the 6-digit guest-review code (kept
 *   in sync with the env variable OTP_LENGTH on the backend).
 */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const REVIEW_OTP_LENGTH = 6;