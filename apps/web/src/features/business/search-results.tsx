'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { StarRating } from '@/components/reviews/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, extractError } from '@/lib/api/client';
import { formatRating } from '@credible/shared';

interface ResultItem {
  id: string;
  slug: string;
  displayName: string;
  logo: string | null;
  city: string | null;
  ratingAverage: string | null;
  ratingCount: number;
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
}

interface Props {
  initial?: { q?: string; category?: string; city?: string; verified?: string };
}

export function SearchResults({ initial = {} }: Props) {
  const [q, setQ] = useState(initial.q ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(initial.verified === 'true');
  const [city, setCity] = useState(initial.city ?? '');

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (city) params.set('city', city);
  if (verifiedOnly) params.set('verifiedOnly', 'true');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['business-search', params.toString()],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ResultItem[] }>(
        `/businesses/search?${params.toString()}`,
      );
      return res.data.data;
    },
  });

  return (
    <>
      <div className="mb-6 grid gap-2 md:grid-cols-[1fr_200px_auto]">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load: {extractError(error).message}</p>
      )}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No businesses match your filters yet.
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => (
            <Link key={b.id} href={`/business/${b.slug}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{b.displayName}</p>
                      {b.city && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {b.city}
                        </p>
                      )}
                    </div>
                    <VerifiedBadge level={b.verificationLevel} withLabel={false} />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <StarRating value={Number(b.ratingAverage ?? 0)} />
                    <span className="text-sm font-medium">{formatRating(b.ratingAverage)}</span>
                    <span className="text-xs text-muted-foreground">({b.ratingCount})</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}