'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dataRequestSchema } from '@credible/shared';
import { cn } from '@/lib/utils';

type DataRequestFormValues = z.infer<typeof dataRequestSchema>;

const REQUEST_TYPES = [
  {
    value: 'ACCESS',
    label: 'Access',
    description: 'Receive a copy of the personal data we hold about you.',
  },
  {
    value: 'CORRECTION',
    label: 'Correction',
    description: 'Fix inaccurate data on your profile.',
  },
  {
    value: 'DELETION',
    label: 'Deletion',
    description: 'Permanently delete your account and personal data.',
  },
  {
    value: 'EXPORT',
    label: 'Export',
    description: 'Download your data in a portable format.',
  },
] as const;

export function DataRequestForm() {
  const user = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DataRequestFormValues>({
    resolver: zodResolver(dataRequestSchema),
    defaultValues: { type: undefined, notes: '' },
  });

  if (!user) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="font-medium">Sign in to submit a data request</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Data requests are tied to your account so we can verify your identity before sharing or
          modifying personal data.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={`/login?next=${encodeURIComponent('/privacy#data-request')}`}>
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await apiClient.post<{
        success: true;
        data: { id: string; createdAt: string };
      }>('/users/me/data-requests', values);
      toast.success(`Request submitted — reference ${res.data.data.id.slice(0, 8)}`);
      form.reset();
    } catch (err) {
      toast.error(friendlyMessage(err, 'generic'));
    } finally {
      setSubmitting(false);
    }
  });

  const currentType = form.watch('type');

  return (
    <form
      id="data-request"
      onSubmit={onSubmit}
      className="space-y-5 rounded-lg border bg-card p-6"
      noValidate
    >
      <div>
        <p className="font-medium">Submit a data request</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the kind of request and add any context. We respond within 7 business days.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Request type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {REQUEST_TYPES.map((opt) => {
            const checked = currentType === opt.value;
            return (
              <label
                key={opt.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent/40',
                  checked && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  value={opt.value}
                  className="mt-0.5 h-4 w-4 accent-primary"
                  {...form.register('type')}
                />
                <span>
                  <span className="block font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        {form.formState.errors.type && (
          <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="Anything we should know about this request?"
          {...form.register('notes')}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit request'}
      </Button>
    </form>
  );
}
