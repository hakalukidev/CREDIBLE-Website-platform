'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminProfessionals } from '@/features/admin/admin-extended-hooks';
import { Loader2 } from 'lucide-react';

export default function AdminProfessionalsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  const { data, isLoading } = useAdminProfessionals({
    page,
    perPage: 25,
    search: search || undefined,
    status: status || undefined,
    verificationStatus: verificationStatus || undefined,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Professionals</h1>
        <p className="text-sm text-muted-foreground">
          Every professional profile on the platform.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Combine filters to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Search display name, profession, slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="PUBLISHED">Published</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
          >
            <option value="">Any verification</option>
            <option value="NOT_STARTED">Not started</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <Button onClick={() => setPage(1)}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : data && data.items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Display name</th>
                    <th className="py-2">Profession</th>
                    <th className="py-2">Slug</th>
                    <th className="py-2">Owner</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="py-2">
                        <Link className="font-medium underline" href={`/admin/professionals/${p.id}`}>
                          {p.displayName}
                        </Link>
                      </td>
                      <td className="py-2 text-muted-foreground">{p.profession ?? '—'}</td>
                      <td className="py-2 text-muted-foreground">{p.slug}</td>
                      <td className="py-2 text-muted-foreground">{p.owner.email}</td>
                      <td className="py-2">{p.status}</td>
                      <td className="py-2">{p.verificationStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} setPage={setPage} total={data.total} perPage={25} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No professionals match your filters.</p>
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