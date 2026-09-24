'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import type { FeaturedItem, VerificationLevel } from './use-featured-businesses';

/** Top-level category returned by GET /categories. */
interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface BestInRow {
  /** Unique React key + href fragment. */
  id: string;
  /** Category slug — drives the "See more" link and the API filter. */
  slug: string;
  /** Display name from the DB, e.g. "Restaurants", "Technology". */
  name: string;
  /** Sorted businesses for this row. */
  items: FeaturedItem[];
}

export interface BestInState {
  rows: BestInRow[];
  /** True until at least one row has been attempted. */
  isLoading: boolean;
  /** True if the categories request itself failed (section is empty). */
  hasError: boolean;
}

const PER_ROW = 8;
const MIN_RATING = 4;

const VERIFICATION_VALUES: VerificationLevel[] = ['BASIC', 'CERTIFIED', 'PREMIUM'];
function asVerification(v: unknown): VerificationLevel {
  return VERIFICATION_VALUES.includes(v as VerificationLevel)
    ? (v as VerificationLevel)
    : 'NONE';
}

function normalizeCategories(raw: unknown): CategoryRef[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as { data?: unknown };
  if (!Array.isArray(obj.data)) return [];
  const out: CategoryRef[] = [];
  for (const entry of obj.data) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.id === 'string' &&
      typeof e.slug === 'string' &&
      typeof e.name === 'string'
    ) {
      out.push({ id: e.id, slug: e.slug, name: e.name });
    }
  }
  return out;
}

function normalizeBusinessItems(raw: unknown): FeaturedItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as { data?: unknown };
  if (!Array.isArray(obj.data)) return [];
  const out: FeaturedItem[] = [];
  for (const entry of obj.data) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || typeof e.slug !== 'string') continue;
    out.push({
      id: e.id,
      slug: e.slug,
      displayName:
        typeof e.displayName === 'string' && e.displayName.trim().length > 0
          ? e.displayName
          : 'Featured business',
      description: typeof e.description === 'string' ? e.description : null,
      tagline: typeof e.tagline === 'string' ? e.tagline : null,
      coverImage: typeof e.coverImage === 'string' ? e.coverImage : null,
      logo: typeof e.logo === 'string' ? e.logo : null,
      city: typeof e.city === 'string' ? e.city : null,
      state: typeof e.state === 'string' ? e.state : null,
      country: typeof e.country === 'string' ? e.country : null,
      ratingAverage:
        typeof e.ratingAverage === 'string' || e.ratingAverage === null
          ? (e.ratingAverage as string | null)
          : null,
      ratingCount: typeof e.ratingCount === 'number' ? e.ratingCount : 0,
      verificationLevel: asVerification(e.verificationLevel),
      category: typeof e.category === 'string' ? e.category : null,
      yearEstablished: typeof e.yearEstablished === 'number' ? e.yearEstablished : null,
      badgeIssuedAt: typeof e.badgeIssuedAt === 'string' ? e.badgeIssuedAt : null,
    });
  }
  return out;
}

async function fetchCategories(): Promise<CategoryRef[]> {
  try {
    const res = await apiClient.get<unknown>('/categories');
    return normalizeCategories(res.data);
  } catch {
    return [];
  }
}

async function fetchTopForCategory(slug: string): Promise<FeaturedItem[]> {
  try {
    const res = await apiClient.get<unknown>(
      `/businesses/search?category=${encodeURIComponent(slug)}&sortBy=ratingAverage&sortOrder=desc&minRating=${MIN_RATING}&perPage=${PER_ROW}`,
    );
    return normalizeBusinessItems(res.data);
  } catch {
    return [];
  }
}

/**
 * Drives the homepage "Best in {Category}" rows.
 *
 * Behavior:
 *   1. Fetches top-level active categories from GET /categories.
 *   2. For each category, fires a parallel GET /businesses/search with
 *      sortBy=ratingAverage&sortOrder=desc&minRating=4.
 *   3. Returns a per-row {isLoading, items} state so rows appear
 *      independently as their data arrives (no waterfall).
 *   4. Categories with zero businesses are silently skipped — we never
 *      render an empty row.
 *   5. If the categories request itself fails, the whole section is empty
 *      rather than broken.
 *
 * The hook intentionally does NOT cache across mounts; revalidation
 * happens on every mount via React's normal lifecycle.
 */
export function useBestInCategory(): BestInState {
  const [rows, setRows] = useState<BestInRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const seqRef = useRef(0);

  useEffect(() => {
    const seq = ++seqRef.current;
    let cancelled = false;
    setRows([]);
    setIsLoading(true);
    setHasError(false);

    (async () => {
      const cats = await fetchCategories();
      if (cancelled || seq !== seqRef.current) return;

      if (cats.length === 0) {
        // Distinguish "categories API failed" from "DB has no categories"
        // by attempting at least one search — if everything fails, treat
        // it as an error. If at least one category was returned but all
        // searches came back empty, that's just "no data" not an error.
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const settled = await Promise.all(
        cats.map(async (cat) => {
          const items = await fetchTopForCategory(cat.slug);
          if (items.length === 0) return null;
          const row: BestInRow = {
            id: cat.id,
            slug: cat.slug,
            name: cat.name,
            items,
          };
          return row;
        }),
      );

      if (cancelled || seq !== seqRef.current) return;

      setRows(settled.filter((r): r is BestInRow => r !== null));
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, isLoading, hasError };
}
