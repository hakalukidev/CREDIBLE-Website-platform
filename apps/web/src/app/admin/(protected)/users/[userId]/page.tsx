'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminUser, useUpdateUser } from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = String(params.userId);
  const { data: user, isLoading } = useAdminUser(userId);
  const update = useUpdateUser();

  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading user…
      </div>
    );
  }

  const onSaveRole = async () => {
    await update.mutateAsync({ id: user.id, role: role as never });
    setRole('');
  };

  const onSaveStatus = async () => {
    await update.mutateAsync({ id: user.id, status: status as never });
    setStatus('');
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Field label="Phone" value={user.phone ?? '—'} />
          <Field label="Role" value={user.role} />
          <Field label="Status" value={user.status} />
          <Field label="Joined" value={formatDate(user.createdAt)} />
          <Field label="Email verified" value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'No'} />
          <Field label="Phone verified" value={user.phoneVerifiedAt ? formatDate(user.phoneVerifiedAt) : 'No'} />
          <Field label="Last login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change role</CardTitle>
          <CardDescription>Move the user between CUSTOMER / BUSINESS / PROFESSIONAL / ADMIN.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Pick role…</option>
            <option value="CUSTOMER">Customer</option>
            <option value="BUSINESS">Business</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ADMIN">Admin</option>
          </select>
          <Button onClick={onSaveRole} disabled={!role || update.isPending}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change status</CardTitle>
          <CardDescription>Suspend, reactivate or delete the account.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Pick status…</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="DELETED">Deleted</option>
          </select>
          <Button onClick={onSaveStatus} disabled={!status || update.isPending}>
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}