'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { Search as SearchIcon, Star, MapPin } from 'lucide-react';

interface ProfessionalListItem {
  id: string;
  slug: string;
  displayName: string;
  profession: string;
  headline?: string | null;
  avatar?: string | null;
  city?: string | null;
  country?: string | null;
  ratingAverage: number | string | null;
  ratingCount: number;
  verified: boolean;
}

interface SearchResponse {
  data: ProfessionalListItem[];
  meta?: { totalPages: number; page: number };
}

export default function ProfessionalsSearchPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [profession, setProfession] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const params: Record<string, string | number | boolean> = { page, perPage: 20 };
  if (q.trim()) params.q = q.trim();
  if (city.trim()) params.city = city.trim();
  if (profession.trim()) params.profession = profession.trim();
  if (verifiedOnly) params.verifiedOnly = true;

  const { data, isLoading } = useQuery({
    queryKey: qk.professionals.search(params),
    queryFn: async () => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => sp.set(k, String(v)));
      const res = await apiClient.get<{ success: true } & SearchResponse>(
        `/professionals/search?${sp.toString()}`,
      );
      return res.data;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="container-wide py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Browse professionals</h1>
        <p className="text-sm text-muted-foreground">
          Doctors, lawyers, consultants, freelancers — find the right professional for the job.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name or keyword"
                className="pl-9"
              />
            </div>
            <Input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Profession (e.g. Doctor)"
            />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-3">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
              />
              Only show Credible Verified professionals
            </label>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {!isLoading && data && data.data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No professionals match your filters.
          </CardContent>
        </Card>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {p.avatar ? (
                      <Image
                        src={p.avatar}
                        alt={p.displayName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-base font-semibold text-muted-foreground">
                        {p.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/p/${p.slug}`}
                      className="font-semibold hover:underline truncate block"
                    >
                      {p.displayName}
                    </Link>
                    <p className="text-xs text-primary font-medium truncate">{p.profession}</p>
                    {p.headline && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {p.headline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {p.ratingAverage != null ? Number(p.ratingAverage).toFixed(1) : '—'}
                        </span>
                        <span className="text-muted-foreground">({p.ratingCount})</span>
                      </span>
                      {(p.city || p.country) && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {[p.city, p.country].filter(Boolean).join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {page} of {data.meta.totalPages}
              </p>
              <Button
                variant="outline"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
