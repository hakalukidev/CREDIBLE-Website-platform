'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminBusiness } from '@/features/admin/admin-extended-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminBusinessDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data, isLoading } = useAdminBusiness(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading business…
      </div>
    );
  }

  const b = data as {
    id: string;
    slug: string;
    displayName: string;
    legalName: string;
    status: string;
    verificationStatus: string;
    ratingAverage: number | null;
    ratingCount: number;
    city: string | null;
    owner?: { email: string; firstName: string | null; lastName: string | null; phone: string | null };
    _count?: { reviews: number; payments: number; subscriptions: number };
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{b.displayName}</h1>
        <p className="text-sm text-muted-foreground">
          <Link href={`/business/${b.slug}`} className="underline" target="_blank">
            View public profile →
          </Link>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Field label="Slug" value={b.slug} />
          <Field label="Legal name" value={b.legalName} />
          <Field label="Status" value={b.status} />
          <Field label="Verification" value={b.verificationStatus} />
          <Field label="City" value={b.city ?? '—'} />
          <Field label="Owner email" value={b.owner?.email ?? '—'} />
          <Field
            label="Owner phone"
            value={b.owner?.phone ?? '—'}
          />
          <Field label="Owner name" value={[b.owner?.firstName, b.owner?.lastName].filter(Boolean).join(' ') || '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-4">
          <Stat label="Rating" value={b.ratingAverage != null ? Number(b.ratingAverage).toFixed(2) : '—'} />
          <Stat label="Reviews" value={String(b._count?.reviews ?? 0)} />
          <Stat label="Payments" value={String(b._count?.payments ?? 0)} />
          <Stat label="Subscriptions" value={String(b._count?.subscriptions ?? 0)} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}