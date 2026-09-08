'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminUsers } from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useAdminUsers({
    page,
    perPage: 25,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Search, suspend, or change the role of any account.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Combine filters to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Search email, name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Any role</option>
            <option value="CUSTOMER">Customer</option>
            <option value="BUSINESS">Business</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="DELETED">Deleted</option>
          </select>
          <Button onClick={() => setPage(1)}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
            </div>
          ) : data && data.items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30">
                      <td className="py-2">
                        <Link className="font-medium underline" href={`/admin/users/${u.id}`}>
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                        </Link>
                      </td>
                      <td className="py-2 text-muted-foreground">{u.email}</td>
                      <td className="py-2">{u.role}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : u.status === 'SUSPENDED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} setPage={setPage} total={data.total} perPage={25} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users match your filters.</p>
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