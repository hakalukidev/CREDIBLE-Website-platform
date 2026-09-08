'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuditLogs } from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useAdminAuditLogs({
    page,
    perPage: 50,
    actorId: actorId || undefined,
    action: action || undefined,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every admin and system action in chronological order.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by actor id or by action prefix.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Actor id (cuid)"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
          />
          <Input
            placeholder="Action prefix (e.g. admin.payment)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
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
                    <th className="py-2">Date</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Actor</th>
                    <th className="py-2">Target</th>
                    <th className="py-2">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr key={row.id} className="border-t align-top hover:bg-muted/30">
                      <td className="py-2 text-muted-foreground">{formatDate(row.createdAt)}</td>
                      <td className="py-2 font-medium">{row.action}</td>
                      <td className="py-2 text-muted-foreground">{row.actorId ?? '—'}</td>
                      <td className="py-2 text-muted-foreground">{row.target ?? '—'}</td>
                      <td className="py-2">
                        <code className="rounded bg-muted/50 px-1 py-0.5 text-xs">
                          {JSON.stringify(row.meta ?? null)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} setPage={setPage} total={data.total} perPage={50} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No audit entries match.</p>
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