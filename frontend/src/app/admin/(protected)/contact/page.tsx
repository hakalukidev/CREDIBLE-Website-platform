'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminContactRequests,
  useUpdateContactRequest,
} from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminContactPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const { data, isLoading } = useAdminContactRequests({
    page,
    perPage: 25,
    status: status || undefined,
  });
  const update = useUpdateContactRequest();

  const open = data?.items.find((c) => c.id === openId);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Contact requests</h1>
        <p className="text-sm text-muted-foreground">Triage inbound contact-form submissions.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="REJECTED">Rejected</option>
          </select>
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
                    <th className="py-2">Date</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Business</th>
                    <th className="py-2">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-muted/30">
                      <td className="py-2 text-muted-foreground">{formatDate(c.createdAt)}</td>
                      <td className="py-2">{c.name}</td>
                      <td className="py-2">{c.email}</td>
                      <td className="py-2">{c.business?.displayName ?? '—'}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.status === 'NEW'
                              ? 'bg-blue-100 text-blue-700'
                              : c.status === 'CONVERTED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : c.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => setOpenId(c.id)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} setPage={setPage} total={data.total} perPage={25} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No requests match.</p>
          )}
        </CardContent>
      </Card>

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>{open.name} — {open.email}</CardTitle>
            <CardDescription>{formatDate(open.createdAt)} · {open.business?.displayName ?? '—'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
              {open.message}
            </p>
            <div className="flex items-end gap-2">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={open.status}
                onChange={(e) =>
                  update.mutate({ id: open.id, status: e.target.value as never })
                }
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <Input
                placeholder="Add a note…"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <Button
                disabled={response.length === 0 || update.isPending}
                onClick={() => {
                  update.mutate({ id: open.id, response });
                  setResponse('');
                }}
              >
                Save note
              </Button>
              <Button variant="outline" onClick={() => setOpenId(null)}>
                Close
              </Button>
            </div>
            {open.notes ? (
              <p className="rounded-md border bg-muted/30 p-2 text-sm">Note: {open.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
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