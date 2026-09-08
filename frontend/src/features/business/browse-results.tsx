'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  ShieldCheck,
  ShieldOff,
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
import { cn } from '@/lib/utils';
import { searchBusinessesSchema, type VerificationLevel } from '@credible/shared';

// 12 per page = exactly 3 rows of 4 cards at the xl breakpoint.
const PER_PAGE = 12;
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
  verificationLevel: VerificationLevel;
  category?: string | null;
  yearEstablished?: number | null;
}

interface SearchResponse {
  data: ResultItem[];
  meta: { page: number; perPage: number; totalPages: number; total: number };
}

// Browse page only offers two sort orders; 'newest' is the default (the
// backend falls back to createdAt desc when no sortBy is supplied).
export type BrowseSortKey = 'newest' | 'top-rated';

const SORT_OPTIONS: Array<{ value: BrowseSortKey; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'top-rated', label: 'Top rated' },
];

const RATING_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Any rating' },
  { value: 4.5, label: '4.5+ stars' },
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
];

// Three-state verification filter. The `all` state sends no extra params;
// `verified` uses the legacy `verifiedOnly` flag (verificationStatus APPROVED);
// `unverified` uses the precise `verificationLevel=NONE` clause.
export type VerifiedState = 'all' | 'verified' | 'unverified';

function toSortParams(key: BrowseSortKey): { sortBy?: string; sortOrder?: 'asc' | 'desc' } {
  switch (key) {
    case 'top-rated':
      return { sortBy: 'ratingAverage', sortOrder: 'desc' };
    case 'newest':
    default:
      return {};
  }
}

function fromSortParams(sortBy?: string, sortOrder?: string): BrowseSortKey {
  if (sortBy === 'ratingAverage' && sortOrder === 'desc') return 'top-rated';
  return 'newest';
}

function fromVerifiedParams(
  verifiedOnly: string | undefined,
  verificationLevel: string | undefined,
): VerifiedState {
  if (verificationLevel === 'NONE') return 'unverified';
  if (verifiedOnly === 'true') return 'verified';
  return 'all';
}

/** Initial filter shape — derived from the zod schema so server + client
 *  stay in sync. `searchParams` arrives as strings, so we use `z.input`
 *  (the pre-coercion shape) rather than `z.infer` (post-coercion). */
export type BrowseFilters = Partial<z.input<typeof searchBusinessesSchema>>;

interface Props {
  initial?: BrowseFilters;
}

function normalizeItems(raw: unknown): {
  items: ResultItem[];
  meta: SearchResponse['meta'] | undefined;
} {
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

export function BrowseResults({ initial = {} }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? '');
  const [category, setCategory] = useState<string | null>(initial.category ?? null);
  const [minRating, setMinRating] = useState<number | null>(
    initial.minRating ? Number(initial.minRating) : null,
  );
  const [sort, setSort] = useState<BrowseSortKey>(
    fromSortParams(initial.sortBy, initial.sortOrder),
  );
  const [verifiedState, setVerifiedState] = useState<VerifiedState>(
    fromVerifiedParams(
      initial.verifiedOnly == null ? undefined : String(initial.verifiedOnly),
      initial.verificationLevel,
    ),
  );
  const [page, setPage] = useState(1);
  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // Out-of-order response guard: only commit data whose seq matches the
  // latest request, so a slow earlier response can't overwrite fresher data.
  const requestSeq = useRef(0);

  const categoriesQuery = useCategories();

  // Raw `q` is the input value (responsive UI); debouncedQ drives the
  // network request (throttled while typing).
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  // filterParams holds the URLSearchParams for the current filter set
  // (page/perPage excluded). Both `requestKey` and `requestUrl` derive
  // from it so we build the params once per filter change instead of
  // round-tripping through toString()/new URLSearchParams(str).
  const filterParams = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set('q', debouncedQ);
    if (category) sp.set('category', category);
    if (minRating != null) sp.set('minRating', String(minRating));
    if (verifiedState === 'verified') sp.set('verifiedOnly', 'true');
    if (verifiedState === 'unverified') sp.set('verificationLevel', 'NONE');
    const { sortBy, sortOrder } = toSortParams(sort);
    if (sortBy) sp.set('sortBy', sortBy);
    if (sortOrder) sp.set('sortOrder', sortOrder);
    return sp;
  }, [debouncedQ, category, minRating, verifiedState, sort]);

  const requestKey = useMemo(() => filterParams.toString(), [filterParams]);

  // Reset page to 1 synchronously when the filter signature changes so
  // the user never sees a stale page flicker.
  useLayoutEffect(() => {
    setPage((p) => (p === 1 ? p : 1));
  }, [requestKey]);

  const requestUrl = useMemo(() => {
    const sp = new URLSearchParams(filterParams);
    sp.set('page', String(page));
    sp.set('perPage', String(PER_PAGE));
    return `/businesses/search?${sp.toString()}`;
  }, [filterParams, page]);

  // Plain `apiClient.get` rather than @tanstack/react-query's `useQuery` —
  // see search-results.tsx for the Turbopack + query-core bundling bug
  // rationale.
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
          console.error('[browse] fetch failed:', err);
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

  // Scroll back to the top of the results when pagination changes.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const { items, meta } = normalizeItems(data);
  const isError = error != null;

  const selectedCategoryName = useMemo(() => {
    if (!category) return 'All categories';
    return (
      categoriesQuery.data?.find((c) => c.slug === category)?.name ?? category
    );
  }, [category, categoriesQuery.data]);

  const activeFilterCount =
    (category ? 1 : 0) +
    (minRating != null ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0) +
    (verifiedState !== 'all' ? 1 : 0);

  function clearFilters() {
    setCategory(null);
    setMinRating(null);
    setSort('newest');
    setVerifiedState('all');
  }

  // Push filter state (not pagination) to the URL — filters must be
  // shareable, but page should be session-local so a shared link doesn't
  // land on a stale page.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    router.replace((requestKey ? `/browse?${requestKey}` : '/browse') as never, {
      scroll: false,
    });
  }, [requestKey, router]);

  return (
    <div className="space-y-6">
      <div ref={topRef} />

      <Card className="p-4 sm:p-5">
        <form
          onSubmit={(e) => {
            // DebouncedQ already triggers a fetch — `submit` is here only
            // so Enter doesn't reload the page before debounce lands.
            e.preventDefault();
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              inputMode="search"
              name="q"
              aria-label="Search businesses by name"
              placeholder="Search businesses by name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 w-full pl-10 text-base"
            />
          </div>
          <Button type="submit" size="lg" className="h-11 px-6 sm:w-auto">
            <Search className="mr-1.5 h-4 w-4 sm:hidden" />
            <span>Search</span>
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <CategoryDropdown
            categories={categoriesQuery.data ?? []}
            value={category}
            onChange={setCategory}
            label={selectedCategoryName}
          />
          <RatingDropdown value={minRating} onChange={setMinRating} />
          <SortDropdown value={sort} onChange={setSort} />
          <div className="ml-auto">
            <VerifiedStateControl value={verifiedState} onChange={setVerifiedState} />
          </div>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-muted-foreground"
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

      {/* Results */}
      {isLoading && (
        <div
          className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && <FriendlyError kind="businesses" />}

      {!isLoading && items.length === 0 && !isError && (
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
          {meta && (
            <p className="text-xs text-muted-foreground">
              Showing {items.length} of {meta.total.toLocaleString()}{' '}
              {meta.total === 1 ? 'business' : 'businesses'}
              {debouncedQ ? (
                <>
                  {' '}for <span className="font-medium text-foreground">&ldquo;{debouncedQ}&rdquo;</span>
                </>
              ) : null}
            </p>
          )}

          <div className="grid grid-cols-1  items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  );
}

// --------------------------------------------------------------------------
// Filter row subcomponents
// --------------------------------------------------------------------------

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
          <span className="max-w-[160px] truncate">{label}</span>
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
  const label = RATING_OPTIONS.find((o) => o.value === value)?.label ?? 'Any rating';
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
            {o.value != null && (
              <Star className="mr-2 h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            )}
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SortDropdownProps {
  value: BrowseSortKey;
  onChange: (v: BrowseSortKey) => void;
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

interface VerifiedStateControlProps {
  value: VerifiedState;
  onChange: (v: VerifiedState) => void;
}

const VERIFIED_SEGMENTS: Array<{
  value: VerifiedState;
  label: string;
  icon: typeof ShieldCheck;
}> = [
  { value: 'all', label: 'All', icon: Filter },
  { value: 'verified', label: 'Verified', icon: ShieldCheck },
  { value: 'unverified', label: 'Unverified', icon: ShieldOff },
];

/**
 * Three-state verification filter:
 *   - `all`         → no extra params
 *   - `verified`    → verifiedOnly=true (verificationStatus APPROVED)
 *   - `unverified`  → verificationLevel=NONE (precise, used by the
 *                     /browse Unverified segment)
 */
function VerifiedStateControl({ value, onChange }: VerifiedStateControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by verification status"
      className="inline-flex h-9 items-center gap-0.5 rounded-full border border-border bg-muted/60 p-0.5 text-xs"
    >
      {VERIFIED_SEGMENTS.map(({ value: segValue, label, icon: Icon }) => {
        const selected = segValue === value;
        return (
          <button
            key={segValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(segValue)}
            className={cn(
              'inline-flex h-8 items-center gap-1 rounded-full px-3 font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
