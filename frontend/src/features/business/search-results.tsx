'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BusinessCard, BusinessCardSkeleton } from '@/components/business/business-card';
import { apiClient, extractError } from '@/lib/api/client';

const PER_PAGE = 8;

interface ResultItem {
  id: string;
  slug: string;
  displayName: string;
  description?: string | null;
  coverImage?: string | null;
  logo: string | null;
  city: string | null;
  state?: string | null;
  country?: string | null;
  ratingAverage: string | null;
  ratingCount: number;
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  category?: string | null;
  yearEstablished?: number | null;
}

interface SearchResponse {
  data: ResultItem[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

interface Props {
  initial?: { q?: string; category?: string; city?: string; verified?: string };
}

/** Coerce an arbitrary response payload into a safe ResultItem list. */
function normalizeItems(raw: unknown): { items: ResultItem[]; meta: SearchResponse['meta'] | undefined } {
  if (!raw || typeof raw !== 'object') return { items: [], meta: undefined };
  const obj = raw as { data?: unknown; meta?: unknown };
  const arr = Array.isArray(obj.data) ? (obj.data as unknown[]) : [];
  const items: ResultItem[] = [];
  for (const entry of arr) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || typeof e.slug !== 'string') continue;
    items.push({
      id: e.id,
      slug: e.slug,
      displayName: typeof e.displayName === 'string' ? e.displayName : 'Untitled business',
      description: typeof e.description === 'string' ? e.description : null,
      coverImage: typeof e.coverImage === 'string' ? e.coverImage : null,
      logo: typeof e.logo === 'string' ? e.logo : null,
      city: typeof e.city === 'string' ? e.city : null,
      state: typeof e.state === 'string' ? e.state : null,
      country: typeof e.country === 'string' ? e.country : null,
      ratingAverage: typeof e.ratingAverage === 'string' ? e.ratingAverage : null,
      ratingCount: typeof e.ratingCount === 'number' ? e.ratingCount : 0,
      verificationLevel: ((): ResultItem['verificationLevel'] => {
        const v = e.verificationLevel;
        return v === 'BASIC' || v === 'CERTIFIED' || v === 'PREMIUM' ? v : 'NONE';
      })(),
      category: typeof e.category === 'string' ? e.category : null,
      yearEstablished: typeof e.yearEstablished === 'number' ? e.yearEstablished : null,
    });
  }
  let meta: SearchResponse['meta'] | undefined;
  if (obj.meta && typeof obj.meta === 'object') {
    const m = obj.meta as Record<string, unknown>;
    if (
      typeof m.page === 'number' &&
      typeof m.perPage === 'number' &&
      typeof m.total === 'number' &&
      typeof m.totalPages === 'number'
    ) {
      meta = { page: m.page, perPage: m.perPage, total: m.total, totalPages: m.totalPages };
    }
  }
  return { items, meta };
}

export function SearchResults({ initial = {} }: Props) {
  const [q, setQ] = useState(initial.q ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(initial.verified === 'true');
  const [city, setCity] = useState(initial.city ?? '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // Track the latest request so out-of-order responses don't overwrite fresher ones.
  const requestSeq = useRef(0);

  // Build a stable query string from the current filters. We use this as
  // the dependency array for the fetch effect, and also in the URL itself
  // for easy sharing / debugging.
  const queryString = (() => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (city) sp.set('city', city);
    if (verifiedOnly) sp.set('verifiedOnly', 'true');
    sp.set('page', String(page));
    sp.set('perPage', String(PER_PAGE));
    return sp.toString();
  })();

  // Fetch whenever the query string changes. We intentionally use plain
  // fetch + useState here instead of @tanstack/react-query's `useQuery`
  // because of a known Turbopack + @tanstack/query-core 5.102.x bundling
  // bug that causes `resolveQueryValue` to be `undefined` at runtime,
  // crashing the component before the cards can render.
  useEffect(() => {
    const seq = ++requestSeq.current;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiClient
      .get<unknown>(`/businesses/search?${queryString}`)
      .then((res) => {
        if (cancelled || seq !== requestSeq.current) return;
        setData(res.data);
      })
      .catch((err) => {
        if (cancelled || seq !== requestSeq.current) return;
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.error('[search] fetch failed:', err);
        }
        setError(err);
        setData(undefined);
      })
      .finally(() => {
        if (cancelled || seq !== requestSeq.current) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [q, city, verifiedOnly]);

  // Scroll to top of results when page changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  // Always derive a safe shape — never trust the backend response.
  const { items, meta } = normalizeItems(data);
  const isError = error != null;

  return (
    <>
      <div ref={topRef} className="mb-6 grid gap-2 md:grid-cols-[1fr_200px_auto]">
        <Input placeholder="Name or keyword" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Button
          variant={verifiedOnly ? 'default' : 'outline'}
          onClick={() => setVerifiedOnly((v) => !v)}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Verified only
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load: {extractError(error).message}</p>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No businesses match your filters yet.
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((b) => (
              <BusinessCard
                key={b.id}
                id={b.id}
                slug={b.slug}
                name={b.displayName}
                description={b.description}
                coverImage={b.coverImage}
                logo={b.logo}
                rating={b.ratingAverage != null ? Number(b.ratingAverage) : null}
                reviewCount={b.ratingCount}
                badgeType={b.verificationLevel}
                location={
                  b.city || b.state || b.country
                    ? { city: b.city, state: b.state, country: b.country }
                    : undefined
                }
                category={b.category}
                establishedYear={b.yearEstablished}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <span className="px-3 text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
