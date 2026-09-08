/**
 * Canonical frontend shapes for businesses.
 *
 * Mirrors the backend Prisma `Business` model and the shared Zod schemas in
 * `@credible/shared/schemas/business`. Keep these in sync when adding fields
 * — search results, the detail page, and the owner dashboard all consume
 * them.
 */

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * One entry in `Business.hoursJson`. Mirrors `businessHoursEntrySchema` on
 * the backend.
 */
export interface BusinessHoursEntry {
  closed: boolean;
  /** HH:mm; ignored when `closed` is true. */
  open?: string;
  /** HH:mm; ignored when `closed` is true. */
  close?: string;
}

export type BusinessDayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type BusinessHoursJson = Partial<Record<BusinessDayKey, BusinessHoursEntry>>;

export type VerificationLevel = 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';

/**
 * Lightweight shape used in lists/search results/cards. Includes the fields
 * the public-facing cards need but leaves heavier fields (full description,
 * hours, gallery) to the detail shape.
 */
export interface BusinessSummary {
  id: string;
  slug: string;
  displayName: string;
  /** Short marketing line shown under business name on cards. */
  tagline?: string;
  logo?: string | null;
  coverImage?: string | null;
  /** At most 6 photo URLs (Google Places usercontent). */
  gallery?: string[];
  ratingAverage: number;
  ratingCount: number;
  verificationLevel?: VerificationLevel;
  isVerified?: boolean;
  category?: BusinessCategory | null;
  city?: string;
  country?: string;
}

/**
 * Everything in `BusinessSummary` plus the long-form fields used on the
 * public detail page.
 */
export interface BusinessDetail extends BusinessSummary {
  legalName?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  yearEstablished?: number;
  employeeCount?: string;
  hoursJson?: BusinessHoursJson;
  tagline?: string;
  metaTitle?: string;
  metaDescription?: string;
}
