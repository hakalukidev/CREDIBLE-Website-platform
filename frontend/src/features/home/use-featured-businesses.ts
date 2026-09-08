'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export type VerificationLevel = 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';

export interface FeaturedItem {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string | null;
  description?: string | null;
  coverImage?: string | null;
  logo: string | null;
  city: string | null;
  state?: string | null;
  country?: string | null;
  ratingAverage: string | null;
  ratingCount: number;
  verificationLevel: VerificationLevel;
  category?: string | null;
  yearEstablished?: number | null;
  badgeIssuedAt?: string | null;
}

const FALLBACK_NAME = 'Featured business';
const VERIFICATION_VALUES: VerificationLevel[] = ['BASIC', 'CERTIFIED', 'PREMIUM'];

function asVerification(v: unknown): VerificationLevel {
  return VERIFICATION_VALUES.includes(v as VerificationLevel)
    ? (v as VerificationLevel)
    : 'NONE';
}

export function normalizeFeaturedItems(raw: unknown): FeaturedItem[] {
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
          : FALLBACK_NAME,
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

interface State {
  items: FeaturedItem[];
  isLoading: boolean;
  isError: boolean;
}

// In-flight promise cache keyed by limit so concurrent callers share one request.
const inflight = new Map<number, Promise<{ ok: true; items: FeaturedItem[] } | { ok: false }>>();

function fetchOnce(limit: number) {
  const existing = inflight.get(limit);
  if (existing) return existing;
  const promise = apiClient
    .get<unknown>(
      `/businesses/search?verifiedOnly=true&sortBy=ratingAverage&sortOrder=desc&perPage=${limit}`,
    )
    .then((res) => ({ ok: true as const, items: normalizeFeaturedItems(res.data) }))
    .catch(() => ({ ok: false as const }))
    .finally(() => {
      // Drop the cache entry on settle so future mounts can refetch.
      inflight.delete(limit);
    });
  inflight.set(limit, promise);
  return promise;
}

/**
 * Shared hook used by home-page components that all need the same
 * "top verified businesses" data. Concurrent callers for the same limit
 * share a single network request; sequential calls refetch.
 */
export function useFeaturedBusinesses(limit: number) {
  const [state, setState] = useState<State>({ items: [], isLoading: true, isError: false });
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    let cancelled = false;
    setState({ items: [], isLoading: true, isError: false });

    fetchOnce(limit).then((result) => {
      if (cancelled || seq !== requestSeq.current) return;
      if (result.ok) {
        setState({ items: result.items, isLoading: false, isError: false });
      } else {
        setState({ items: [], isLoading: false, isError: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return state;
}
