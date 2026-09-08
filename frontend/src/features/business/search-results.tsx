'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BusinessCard, BusinessCardSkeleton } from '@/components/business/business-card';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { normalizeFeaturedItems } from '@/features/home/use-featured-businesses';
import { useCategories } from '@/features/categories/use-categories';

const PER_PAGE = 8;
const TEXT_DEBOUNCE_MS = 300;

interface ResultItem {
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
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  category?: string | null;
  yearEstablished?: number | null;
}

interface SearchResponse {
  data: ResultItem[];
  meta: { page: number; perPage: number; totalPages: number; total: number };
}

export type SortKey = 'newest' | 'top-rated' | 'most-reviewed' | 'a-z';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'top-rated', label: 'Top rated' },
  { value: 'most-reviewed', label: 'Most reviewed' },
  { value: 'a-z', label: 'A–Z' },
];

const RATING_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Any rating' },
  { value: 4.5, label: '4.5+ stars' },
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
  { value: 2, label: '2+ stars' },
];

function toSortParams(key: SortKey): { sortBy?: string; sortOrder?: 'asc' | 'desc' } {
  switch (key) {
    case 'top-rated':
      return { sortBy: 'ratingAverage', sortOrder: 'desc' };
    case 'most-reviewed':
      return { sortBy: 'ratingCount', sortOrder: 'desc' };
    case 'a-z':
      return { sortBy: 'displayName', sortOrder: 'asc' };
    default:
      return {};
  }
}

function fromSortParams(sortBy?: string, sortOrder?: string): SortKey {
  if (sortBy === 'ratingAverage' && sortOrder === 'desc') return 'top-rated';
  if (sortBy === 'ratingCount' && sortOrder === 'desc') return 'most-reviewed';
  if (sortBy === 'displayName' && sortOrder === 'asc') return 'a-z';
  return 'newest';
}

/** Initial filter shape shared with the server component. */
export interface SearchFilters {
  q?: string;
  category?: string;
  city?: string;
  state?: string;
  verified?: string;
  minRating?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface Props {
  initial?: SearchFilters;
}

function normalizeItems(raw: unknown): { items: ResultItem[]; meta: SearchResponse['meta'] | undefined } {
  const items = normalizeFeaturedItems(raw);
  if (!raw || typeof raw !== 'object') return { items: [], meta: undefined };
  const obj = raw as { meta?: unknown };
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
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? '');
  const [category, setCategory] = useState<string | null>(initial.category ?? null);
  const [city, setCity] = useState(initial.city ?? '');
  const [state, setState] = useState(initial.state ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(initial.verified === 'true');
  const [minRating, setMinRating] = useState<number | null>(
    initial.minRating ? Number(initial.minRating) : null,
  );
  const [sort, setSort] = useState<SortKey>(
    fromSortParams(initial.sortBy, initial.sortOrder),
  );
  const [page, setPage] = useState(1);
  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // Track the latest request so out-of-order responses don't overwrite fresher ones.
  const requestSeq = useRef(0);

  const categoriesQuery = useCategories();

  // Debounced text values for the API request — keeps the network quiet
  // while the user is still typing. The raw `q`/`city`/`state` inputs stay
  // local so the field UI stays responsive.
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [debouncedCity, setDebouncedCity] = useState(city);
  const [debouncedState, setDebouncedState] = useState(state);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(city), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [city]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedState(state), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state]);

  // A single "request signature" — combines the filter set with the page.
  // Filter changes implicitly reset page to 1 so a filter edit never
  // requests a stale page (no double fetch, no flicker of page 2 followed
  // by page 1).
  const requestKey = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set('q', debouncedQ);
    if (category) sp.set('category', category);
    if (debouncedCity) sp.set('city', debouncedCity);
    if (debouncedState) sp.set('state', debouncedState);
    if (verifiedOnly) sp.set('verifiedOnly', 'true');
    if (minRating != null) sp.set('minRating', String(minRating));
    const { sortBy, sortOrder } = toSortParams(sort);
    if (sortBy) sp.set('sortBy', sortBy);
    if (sortOrder) sp.set('sortOrder', sortOrder);
    return sp.toString();
  }, [debouncedQ, category, debouncedCity, debouncedState, verifiedOnly, minRating, sort]);

  // Reset page to 1 synchronously when the filter signature changes.
  // `useLayoutEffect` runs before paint, so the user never sees the
  // stale page flicker. The actual network request uses `page` from
  // state — by the time it fires, `setPage(1)` has already settled.
  useLayoutEffect(() => {
    setPage((p) => (p === 1 ? p : 1));
  }, [requestKey]);

  const requestUrl = useMemo(() => {
    const sp = new URLSearchParams(requestKey);
    sp.set('page', String(page));
    sp.set('perPage', String(PER_PAGE));
    return `/businesses/search?${sp.toString()}`;
  }, [requestKey, page]);

  // Fetch whenever the URL changes. We intentionally use plain
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
      .get<unknown>(requestUrl)
      .then((res) => {
        if (cancelled || seq !== requestSeq.current) return;
        setData(res.data);
      })
      .catch((err) => {
        if (cancelled || seq !== requestSeq.current) return;
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
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
  }, [requestUrl]);

  // Scroll to top of results when page changes.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const { items, meta } = normalizeItems(data);
  const isError = error != null;

  const selectedCategoryName = useMemo(() => {
    if (!category) return 'All categories';
    return categoriesQuery.data?.find((c) => c.slug === category)?.name ?? category;
  }, [category, categoriesQuery.data]);

  const activeFilterCount =
    (category ? 1 : 0) +
    (city ? 1 : 0) +
    (state ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (minRating != null ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0);

  function clearFilters() {
    setCategory(null);
    setCity('');
    setState('');
    setVerifiedOnly(false);
    setMinRating(null);
    setSort('newest');
  }

  // Push filter state (not pagination) back to the URL so filters are
  // shareable. Pagination lives in session-local state so a shared link
  // doesn't lead to a stale page.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    router.replace(
      (requestKey ? `/search?${requestKey}` : '/search') as never,
      { scroll: false },
    );
  }, [requestKey, router]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <div ref={topRef} className="lg:contents">
        {/* Two-pane layout on `lg+`: filters pinned to the left rail,
            results to the right. On mobile the filters collapse into
            a horizontal chip bar above the results so the layout
            stays usable without a sidebar. */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Refine
            </p>
            <div className="space-y-3">
              <CategoryDropdown
                categories={categoriesQuery.data ?? []}
                value={category}
                onChange={setCategory}
                label={selectedCategoryName}
              />
              <Input
                className="h-10 w-full"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                className="h-10 w-full"
                placeholder="State / region"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <RatingDropdown value={minRating} onChange={setMinRating} />
              <SortDropdown value={sort} onChange={setSort} />
              <Button
                type="button"
                variant={verifiedOnly ? 'default' : 'outline'}
                className="h-10 w-full justify-center gap-2 rounded-full"
                onClick={() => setVerifiedOnly((v) => !v)}
              >
                <ShieldCheck className="h-4 w-4" />
                Verified only
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-center gap-2 text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-foreground">
                    {activeFilterCount}
                  </span>
                </Button>
              )}
            </div>
          </Card>
        </aside>

        <div>
          {/* Mobile-only horizontal filter chip bar — duplicates the
              sidebar's actions for the small breakpoint. */}
          <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
            <CategoryDropdown
              categories={categoriesQuery.data ?? []}
              value={category}
              onChange={setCategory}
              label={selectedCategoryName}
            />
            <RatingDropdown value={minRating} onChange={setMinRating} />
            <SortDropdown value={sort} onChange={setSort} />
            <Button
              type="button"
              variant={verifiedOnly ? 'default' : 'outline'}
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setVerifiedOnly((v) => !v)}
            >
              <ShieldCheck className="h-4 w-4" />
              Verified only
            </Button>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <BusinessCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && <FriendlyError kind="businesses" />}

          {!isLoading && items.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No businesses match your filters.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try widening your search or clearing a filter.
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {items.length > 0 && (
            <>
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((b) => (
                  <BusinessCard
                    key={b.id}
                    id={b.id}
                    slug={b.slug}
                    name={b.displayName}
                    tagline={b.tagline}
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
                <nav
                  className="mt-8 flex items-center justify-center gap-2"
                  aria-label="Pagination"
                >
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
        </div>
      </div>
    </div>
  );
}

interface CategoryDropdownProps {
  categories: Array<{ id: string; slug: string; name: string }>;
  value: string | null;
  onChange: (slug: string | null) => void;
  label: string;
}

function CategoryDropdown({ categories, value, onChange, label }: CategoryDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={value ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
        >
          <Tag className="h-4 w-4" />
          <span className="max-w-[140px] truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
        <DropdownMenuLabel>Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onChange(null)}
          className={value == null ? 'bg-muted font-medium' : ''}
        >
          <Filter className="mr-2 h-3.5 w-3.5" /> All categories
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">Loading categories…</p>
        ) : (
          categories.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => onChange(c.slug)}
              className={value === c.slug ? 'bg-muted font-medium' : ''}
            >
              {c.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface RatingDropdownProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

function RatingDropdown({ value, onChange }: RatingDropdownProps) {
  const label =
    RATING_OPTIONS.find((o) => o.value === value)?.label ?? 'Any rating';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={value != null ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
        >
          <Star className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>Minimum rating</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {RATING_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.label}
            onSelect={() => onChange(o.value)}
            className={value === o.value ? 'bg-muted font-medium' : ''}
          >
            {o.value != null && <Star className="mr-2 h-3.5 w-3.5 fill-amber-500 text-amber-500" />}
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SortDropdownProps {
  value: SortKey;
  onChange: (v: SortKey) => void;
}

function SortDropdown({ value, onChange }: SortDropdownProps) {
  const label = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Newest';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={value === 'newest' ? 'outline' : 'default'}
          size="sm"
          className="h-9 gap-1.5"
        >
          Sort: {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SORT_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => onChange(o.value)}
            className={value === o.value ? 'bg-muted font-medium' : ''}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
