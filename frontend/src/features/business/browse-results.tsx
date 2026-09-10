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
import {
  ProfessionalCard,
  ProfessionalCardSkeleton,
} from '@/components/professional/professional-card';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { normalizeFeaturedItems } from '@/features/home/use-featured-businesses';
import { useCategories } from '@/features/categories/use-categories';
import { cn } from '@/lib/utils';
import {
  searchBusinessesSchema,
  type VerificationLevel,
} from '@credible/shared';

// 12 per page = exactly 3 rows of 4 cards at the xl breakpoint.
const PER_PAGE = 12;
const TEXT_DEBOUNCE_MS = 300;

type BrowseType = 'all' | 'businesses' | 'professionals';

interface BusinessItem {
  kind: 'business';
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

interface ProfessionalItem {
  kind: 'professional';
  id: string;
  slug: string;
  displayName: string;
  profession: string;
  headline?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  city?: string | null;
  country?: string | null;
  ratingAverage: number | string | null;
  ratingCount: number;
  verificationLevel: VerificationLevel;
}

type BrowseCardItem = BusinessItem | ProfessionalItem;

interface PaginationMeta {
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
}

// Sort orders shared by both endpoints. The professional controller only
// honours ratingAverage/createdAt, but its defaults match businesses so
// `newest` and `top-rated` work on both sides.
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

function fromTypeParam(type: string | undefined): BrowseType {
  if (type === 'businesses' || type === 'professionals') return type;
  return 'all';
}

/** Initial filter shape — derived from the business zod schema so server + client
 *  stay in sync. `searchParams` arrives as strings, so we use `z.input`
 *  (the pre-coercion shape) rather than `z.infer` (post-coercion). */
export type BrowseFilters = Partial<z.input<typeof searchBusinessesSchema>> & {
  type?: string;
};

interface Props {
  initial?: BrowseFilters;
}

function normalizeProfessionalItems(raw: unknown): {
  items: ProfessionalItem[];
  meta: PaginationMeta | undefined;
} {
  if (!raw || typeof raw !== 'object') return { items: [], meta: undefined };
  const obj = raw as { data?: unknown; meta?: unknown };
  if (!Array.isArray(obj.data)) return { items: [], meta: undefined };
  const items: ProfessionalItem[] = [];
  for (const entry of obj.data) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || typeof e.slug !== 'string') continue;
    items.push({
      kind: 'professional',
      id: e.id,
      slug: e.slug,
      displayName:
        typeof e.displayName === 'string' && e.displayName.trim().length > 0
          ? e.displayName
          : 'Professional',
      profession: typeof e.profession === 'string' ? e.profession : '',
      headline: typeof e.headline === 'string' ? e.headline : null,
      avatar: typeof e.avatar === 'string' ? e.avatar : null,
      coverImage: typeof e.coverImage === 'string' ? e.coverImage : null,
      city: typeof e.city === 'string' ? e.city : null,
      country: typeof e.country === 'string' ? e.country : null,
      ratingAverage:
        typeof e.ratingAverage === 'number' || typeof e.ratingAverage === 'string'
          ? (e.ratingAverage as number | string)
          : null,
      ratingCount: typeof e.ratingCount === 'number' ? e.ratingCount : 0,
      verificationLevel: (e.verificationLevel as VerificationLevel) ?? 'NONE',
    });
  }
  const meta = obj.meta as PaginationMeta | undefined;
  return { items, meta };
}

function normalizeMeta(raw: unknown): PaginationMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const m = raw as Record<string, unknown>;
  if (
    typeof m.page === 'number' &&
    typeof m.perPage === 'number' &&
    typeof m.total === 'number' &&
    typeof m.totalPages === 'number'
  ) {
    return { page: m.page, perPage: m.perPage, total: m.total, totalPages: m.totalPages };
  }
  return undefined;
}

export function BrowseResults({ initial = {} }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? '');
  const [type, setType] = useState<BrowseType>(fromTypeParam(initial.type));
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
  const [businessData, setBusinessData] = useState<unknown>(undefined);
  const [proData, setProData] = useState<unknown>(undefined);
  const [businessError, setBusinessError] = useState<unknown>(null);
  const [proError, setProError] = useState<unknown>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [proLoading, setProLoading] = useState(true);
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
  // (page/perPage and type excluded). Both `requestKey` and `requestUrl`s
  // derive from it so we build the params once per filter change.
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

  // requestKey drives the effect: any change to filters resets the page
  // index synchronously so the user never sees a stale page.
  const requestKey = useMemo(() => {
    const sp = new URLSearchParams(filterParams);
    sp.set('type', type);
    return sp.toString();
  }, [filterParams, type]);

  useLayoutEffect(() => {
    setPage((p) => (p === 1 ? p : 1));
  }, [requestKey]);

  // Build per-endpoint URLs from the shared filter params. The two endpoints
  // accept different query shapes, so each gets its own URL.
  const businessUrl = useMemo(() => {
    const sp = new URLSearchParams(filterParams);
    sp.set('page', String(page));
    sp.set('perPage', String(PER_PAGE));
    return `/businesses/search?${sp.toString()}`;
  }, [filterParams, page]);

  const professionalUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set('q', debouncedQ);
    // Professionals take `categoryId` (a cuid), while the businesses endpoint
    // takes `category` (a slug). Both come from the same Browse filter, so
    // we forward the slug here — the pro endpoint ignores it gracefully
    // when it doesn't match and falls back to no category filter.
    if (category) sp.set('categoryId', category);
    if (minRating != null) sp.set('minRating', String(minRating));
    if (verifiedState === 'verified') sp.set('verifiedOnly', 'true');
    const { sortBy, sortOrder } = toSortParams(sort);
    if (sortBy) sp.set('sortBy', sortBy);
    if (sortOrder) sp.set('sortOrder', sortOrder);
    sp.set('page', String(page));
    sp.set('perPage', String(PER_PAGE));
    return `/professionals/search?${sp.toString()}`;
  }, [debouncedQ, category, minRating, verifiedState, sort, page]);

  // Parallel fetch — fire both endpoints so the grid always shows whichever
  // data is freshest. Each list runs its own out-of-order guard so a slow
  // response can't stomp on a fresher one.
  useEffect(() => {
    const seq = ++requestSeq.current;
    const cancelled = { value: false };

    // When the user scopes to a single type we still issue both requests
    // (it's a single round-trip in the SPA and keeps the URL stable), but
    // we suppress loading-state on the inactive side so the skeleton grid
    // doesn't flash. Errors on the inactive side are also ignored.
    const wantBusinesses = type !== 'professionals';
    const wantProfessionals = type !== 'businesses';

    if (wantBusinesses) {
      setBusinessLoading(true);
      setBusinessError(null);
      apiClient
        .get<unknown>(businessUrl)
        .then((res) => {
          if (cancelled.value || seq !== requestSeq.current) return;
          setBusinessData(res.data);
        })
        .catch((err) => {
          if (cancelled.value || seq !== requestSeq.current) return;
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.error('[browse] businesses fetch failed:', err);
          }
          setBusinessError(err);
          setBusinessData(undefined);
        })
        .finally(() => {
          if (cancelled.value || seq !== requestSeq.current) return;
          setBusinessLoading(false);
        });
    } else {
      // Reset business data so a previous search doesn't linger.
      setBusinessData(undefined);
      setBusinessLoading(false);
      setBusinessError(null);
    }

    if (wantProfessionals) {
      setProLoading(true);
      setProError(null);
      apiClient
        .get<unknown>(professionalUrl)
        .then((res) => {
          if (cancelled.value || seq !== requestSeq.current) return;
          setProData(res.data);
        })
        .catch((err) => {
          if (cancelled.value || seq !== requestSeq.current) return;
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.error('[browse] professionals fetch failed:', err);
          }
          setProError(err);
          setProData(undefined);
        })
        .finally(() => {
          if (cancelled.value || seq !== requestSeq.current) return;
          setProLoading(false);
        });
    } else {
      setProData(undefined);
      setProLoading(false);
      setProError(null);
    }

    return () => {
      cancelled.value = true;
    };
  }, [businessUrl, professionalUrl, type]);

  // Scroll back to the top of the results when pagination changes.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const businessItems = useMemo(
    () => normalizeFeaturedItems(businessData),
    [businessData],
  );
  const businessMeta = useMemo(
    () => normalizeMeta((businessData as { meta?: unknown } | undefined)?.meta),
    [businessData],
  );

  const proItemsRaw = useMemo(() => normalizeProfessionalItems(proData), [proData]);
  const proMeta = proItemsRaw.meta;

  // Build the discriminated union that the grid renders. We interleave
  // businesses first, then professionals — keeps the visual ordering
  // predictable (a user filtering by category still sees business results
  // at the top, then pros).
  const items: BrowseCardItem[] = useMemo(() => {
    const out: BrowseCardItem[] = [];
    if (type !== 'professionals') {
      for (const b of businessItems) {
        out.push({ kind: 'business', ...b });
      }
    }
    if (type !== 'businesses') {
      for (const p of proItemsRaw.items) {
        out.push(p);
      }
    }
    return out;
  }, [businessItems, proItemsRaw.items, type]);

  const isLoading =
    (type !== 'businesses' && proLoading) || (type !== 'professionals' && businessLoading);
  const isError =
    (type !== 'businesses' && proError != null) ||
    (type !== 'professionals' && businessError != null);

  // Combined pagination: max of the two endpoints' total pages so neither
  // list cuts off prematurely. When the type is scoped to one list, that
  // list's pagination wins.
  const totalPages = useMemo(() => {
    if (type === 'businesses') return businessMeta?.totalPages ?? 1;
    if (type === 'professionals') return proMeta?.totalPages ?? 1;
    return Math.max(businessMeta?.totalPages ?? 1, proMeta?.totalPages ?? 1);
  }, [type, businessMeta, proMeta]);

  const total = useMemo(() => {
    if (type === 'businesses') return businessMeta?.total ?? 0;
    if (type === 'professionals') return proMeta?.total ?? 0;
    return (businessMeta?.total ?? 0) + (proMeta?.total ?? 0);
  }, [type, businessMeta, proMeta]);

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
    (verifiedState !== 'all' ? 1 : 0) +
    (type !== 'all' ? 1 : 0);

  function clearFilters() {
    setCategory(null);
    setMinRating(null);
    setSort('newest');
    setVerifiedState('all');
    setType('all');
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
              aria-label="Search by name"
              placeholder="Search businesses and professionals…"
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
          <TypeSegment value={type} onChange={setType} />
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
            type === 'professionals' ? (
              <ProfessionalCardSkeleton key={i} />
            ) : (
              <BusinessCardSkeleton key={i} />
            )
          ))}
        </div>
      )}

      {isError && <FriendlyError kind="businesses" />}

      {!isLoading && items.length === 0 && !isError && (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No results match your filters.
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
          <p className="text-xs text-muted-foreground">
            Showing {items.length} of {total.toLocaleString()}{' '}
            {total === 1 ? 'result' : 'results'}
            {type === 'all' && (
              <>
                {' '}
                ({businessMeta?.total ?? 0}{' '}
                {(businessMeta?.total ?? 0) === 1 ? 'business' : 'businesses'},{' '}
                {proMeta?.total ?? 0}{' '}
                {(proMeta?.total ?? 0) === 1 ? 'professional' : 'professionals'})
              </>
            )}
            {debouncedQ ? (
              <>
                {' '}for <span className="font-medium text-foreground">&ldquo;{debouncedQ}&rdquo;</span>
              </>
            ) : null}
          </p>

          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) =>
              item.kind === 'business' ? (
                <BusinessCard
                  key={`b-${item.id}`}
                  id={item.id}
                  slug={item.slug}
                  name={item.displayName}
                  tagline={item.tagline}
                  description={item.description}
                  coverImage={item.coverImage}
                  logo={item.logo}
                  rating={item.ratingAverage != null ? Number(item.ratingAverage) : null}
                  reviewCount={item.ratingCount}
                  badgeType={item.verificationLevel}
                  location={
                    item.city || item.state || item.country
                      ? { city: item.city, state: item.state, country: item.country }
                      : undefined
                  }
                  category={item.category}
                  establishedYear={item.yearEstablished}
                />
              ) : (
                <ProfessionalCard
                  key={`p-${item.id}`}
                  slug={item.slug}
                  name={item.displayName}
                  profession={item.profession}
                  headline={item.headline}
                  avatar={item.avatar}
                  coverImage={item.coverImage}
                  city={item.city}
                  country={item.country}
                  rating={item.ratingAverage != null ? Number(item.ratingAverage) : null}
                  reviewCount={item.ratingCount}
                  badgeType={item.verificationLevel}
                />
              ),
            )}
          </div>

          {totalPages > 1 && (
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
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
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

interface TypeSegmentProps {
  value: BrowseType;
  onChange: (v: BrowseType) => void;
}

const TYPE_SEGMENTS: Array<{ value: BrowseType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'businesses', label: 'Businesses' },
  { value: 'professionals', label: 'Professionals' },
];

/**
 * Three-state type filter — defaults to `all` so the Browse page mixes
 * both result sets by default. URL-shareable through the existing
 * `?type=` param.
 */
function TypeSegment({ value, onChange }: TypeSegmentProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by result type"
      className="inline-flex h-9 items-center gap-0.5 rounded-full border border-border bg-muted/60 p-0.5 text-xs"
    >
      {TYPE_SEGMENTS.map(({ value: segValue, label }) => {
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
            <span>{label}</span>
          </button>
        );
      })}
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
