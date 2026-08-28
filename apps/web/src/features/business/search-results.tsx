'use client';

import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export function SearchResults({ initial = {} }: Props) {
  const [q, setQ] = useState(initial.q ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(initial.verified === 'true');
  const [city, setCity] = useState(initial.city ?? '');
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (city) params.set('city', city);
  if (verifiedOnly) params.set('verifiedOnly', 'true');
  params.set('page', String(page));
  params.set('perPage', String(PER_PAGE));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['business-search', params.toString()],
    queryFn: async () => {
      const res = await apiClient.get<SearchResponse>(
        `/businesses/search?${params.toString()}`,
      );
      return res.data;
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [q, city, verifiedOnly]);

  // Scroll to top of results when page changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const items = data?.data ?? [];
  const meta = data?.meta;

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
