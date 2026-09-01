'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminReviews } from '@/features/admin/admin-reviews-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [targetType, setTargetType] = useState('');
  const [minRating, setMinRating] = useState('');

  const { data, isLoading } = useAdminReviews({
    page,
    perPage: 25,
    search: search || undefined,
    status: status || undefined,
    targetType: targetType || undefined,
    minRating: minRating || undefined,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Review moderation</h1>
        <p className="text-sm text-muted-foreground">
          Triage flagged reviews, post admin responses, and force-publish / hide / moderate.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Combine filters to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          <Input
            placeholder="Search content, author, target"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="PENDING_MODERATION">Pending moderation</option>
            <option value="FLAGGED">Flagged</option>
            <option value="PUBLISHED">Published</option>
            <option value="HIDDEN">Hidden</option>
            <option value="DELETED">Deleted</option>
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            <option value="">Any target</option>
            <option value="BUSINESS">Business</option>
            <option value="PROFESSIONAL">Professional</option>
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ stars
              </option>
            ))}
          </select>
          <Button onClick={() => setPage(1)}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
            </div>
          ) : data && data.items.length ? (
            <div className="space-y-3">
              {data.items.map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(r.createdAt)}</span>
                        <span>·</span>
                        <span>{r.user.email}</span>
                        <span>·</span>
                        <span className="font-medium">
                          {r.targetType === 'BUSINESS' ? r.business?.displayName : r.professional?.displayName}
                        </span>
                        <span>·</span>
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
                          {r.rating}★
                        </span>
                      </div>
                      <p className="mt-1 text-sm">
                        {r.title ? <strong>{r.title}</strong> : null}
                      </p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{r.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          r.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'PENDING_MODERATION' || r.status === 'FLAGGED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {r.status}
                      </span>
                      {r.flags.length ? (
                        <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700">
                          {r.flags.length} flag{r.flags.length === 1 ? '' : 's'}
                        </span>
                      ) : null}
                      <Link className="underline" href={`/admin/reviews/${r.id}`}>
                        Open →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <Pagination page={page} setPage={setPage} total={data.total} perPage={25} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Pagination({
  page,
  setPage,
  total,
  perPage,
}: {
  page: number;
  setPage: (p: number) => void;
  total: number;
  perPage: number;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Page {page} of {pages} ({total} total)
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= pages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}