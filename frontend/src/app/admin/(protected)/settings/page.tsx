'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminSettings, useUpdateSetting } from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateSetting();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const onEdit = (key: string, value: unknown) => {
    setEditing(key);
    setDraft(JSON.stringify(value ?? null, null, 2));
  };

  const onSave = async () => {
    if (!editing) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      parsed = draft;
    }
    await update.mutateAsync({ key: editing, value: parsed });
    setEditing(null);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Read and edit platform-wide configuration values.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All settings</CardTitle>
          <CardDescription>
            Values are stored as JSON. Click a row to edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : data && data.length ? (
            <div className="space-y-2">
              {data.map((s) => (
                <div key={s.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.key}</div>
                    <div className="text-xs text-muted-foreground">
                      Updated {formatDate(s.updatedAt)}
                    </div>
                  </div>
                  {editing === s.key ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button onClick={onSave} disabled={update.isPending}>
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <pre className="mt-2 overflow-x-auto rounded bg-muted/30 p-2 text-xs">
                        {JSON.stringify(s.valueJson ?? null, null, 2)}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => onEdit(s.key, s.valueJson)}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No settings yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}