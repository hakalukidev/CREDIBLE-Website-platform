'use client';

import { useEffect, useState } from 'react';
import {
  useAdminDeletePlan,
  useAdminPlans,
  useAdminUpsertPlan,
  type AdminPlan,
} from '@/features/admin/pricing-hooks';
import {
  PLAN_AUDIENCES,
  PLAN_AUDIENCE_LABEL,
  SUBSCRIPTION_PLANS,
} from '@credible/shared';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminStatusBadge } from '@/components/admin/admin-status-badge';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { Loader2, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';

const PLAN_CODES = SUBSCRIPTION_PLANS;

const EMPTY_FORM = {
  code: 'BASIC' as AdminPlan['code'],
  name: '',
  description: '',
  priceYearly: '0',
  currency: 'USD',
  audience: 'ALL' as 'ALL' | 'BUSINESS' | 'PROFESSIONAL',
  ctaLabel: '',
  highlights: '' as string, // raw textarea; split on save
  hasBadge: true,
  hasVerification: true,
  isActive: true,
  priority: '0',
};

type FormState = typeof EMPTY_FORM;

export default function AdminPlansPage() {
  const { data: plans, isLoading } = useAdminPlans();
  const upsert = useAdminUpsertPlan();
  const del = useAdminDeletePlan();
  const [editingCode, setEditingCode] = useState<AdminPlan['code'] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminPlan | null>(null);

  // Reset the form when switching between create-new and edit-existing.
  useEffect(() => {
    if (editingCode === null) {
      setForm(EMPTY_FORM);
    }
  }, [editingCode]);

  function startEdit(plan: AdminPlan) {
    setEditingCode(plan.code);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description ?? '',
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      audience: plan.audience,
      ctaLabel: plan.ctaLabel ?? '',
      highlights: plan.highlights.join('\n'),
      hasBadge: plan.hasBadge,
      hasVerification: plan.hasVerification,
      isActive: plan.isActive,
      priority: String(plan.priority),
    });
  }

  function reset() {
    setEditingCode(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const priceYearly = Number(form.priceYearly);
    if (!Number.isFinite(priceYearly) || priceYearly < 0) return;
    const priority = Number(form.priority);
    const highlights = form.highlights
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await upsert.mutateAsync({
      code: form.code,
      name: form.name.trim() || form.code,
      description: form.description.trim() || undefined,
      priceYearly,
      currency: form.currency.trim().toUpperCase(),
      audience: form.audience,
      ctaLabel: form.ctaLabel.trim() ? form.ctaLabel.trim() : null,
      highlights,
      hasBadge: form.hasBadge,
      hasVerification: form.hasVerification,
      isActive: form.isActive,
      priority: Number.isFinite(priority) ? priority : 0,
    });
    reset();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await del.mutateAsync(deleteTarget.code);
    if (editingCode === deleteTarget.code) reset();
    setDeleteTarget(null);
  }

  const formTitle = editingCode ? `Edit ${editingCode} plan` : 'Create a new plan';
  const formDescription = editingCode
    ? 'Updates apply to the marketing pricing section immediately after the public cache expires.'
    : 'New plans appear on the marketing pages once `isActive` is true and the public cache refreshes.';

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Pricing plans</h1>
        <p className="text-sm text-muted-foreground">
          Manage the plans shown on <code>/for-business</code> and{' '}
          <code>/for-professionals</code>. Edits propagate to the public
          <code className="mx-1">/plans</code> cache within five minutes.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{formTitle}</CardTitle>
              <CardDescription>{formDescription}</CardDescription>
            </div>
            {editingCode ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-3">
            <Field id="code" label="Plan code">
              <select
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value as AdminPlan['code'] })}
                disabled={Boolean(editingCode)}
                className="flex h-10 w-full rounded-xl border border-input bg-card/60 px-3 py-2 text-sm shadow-card focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PLAN_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="name" label="Display name">
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Verified Business"
                required
              />
            </Field>

            <Field id="audience" label="Audience">
              <select
                id="audience"
                value={form.audience}
                onChange={(e) =>
                  setForm({ ...form, audience: e.target.value as FormState['audience'] })
                }
                className="flex h-10 w-full rounded-xl border border-input bg-card/60 px-3 py-2 text-sm shadow-card focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                {PLAN_AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {PLAN_AUDIENCE_LABEL[a]}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="price" label="Price (yearly)">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.priceYearly}
                onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
                required
              />
            </Field>

            <Field id="currency" label="Currency">
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })
                }
                placeholder="USD"
                maxLength={3}
                required
              />
            </Field>

            <Field id="priority" label="Display order">
              <Input
                id="priority"
                type="number"
                min="0"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
            </Field>

            <Field id="cta" label="CTA label (optional)" fullWidth>
              <Input
                id="cta"
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                placeholder="Get started"
                maxLength={40}
              />
            </Field>

            <Field id="description" label="Description" fullWidth>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="One sentence the visitor reads below the plan name."
                maxLength={500}
              />
            </Field>

            <Field id="highlights" label="Marketing highlights (one per line)" fullWidth>
              <Textarea
                id="highlights"
                value={form.highlights}
                onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                placeholder={
                  'Verified review badge\nTwo-way review replies\nAnalytics dashboard'
                }
                rows={5}
              />
              <p className="text-[11px] text-muted-foreground">
                Empty lines are ignored. These bullets appear on the marketing pricing card.
              </p>
            </Field>

            <div className="md:col-span-3 grid gap-3 sm:grid-cols-3">
              <Toggle
                id="isActive"
                label="Active"
                hint="Show this plan on the marketing pricing section."
                checked={form.isActive}
                onChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Toggle
                id="hasBadge"
                label="Has badge"
                hint="Plan grants the Credible Certified badge."
                checked={form.hasBadge}
                onChange={(v) => setForm({ ...form, hasBadge: v })}
              />
              <Toggle
                id="hasVerification"
                label="Has verification"
                hint="Plan includes human-reviewed application."
                checked={form.hasVerification}
                onChange={(v) => setForm({ ...form, hasVerification: v })}
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={upsert.isPending} className="gap-1.5">
                {upsert.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingCode ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingCode ? 'Save changes' : 'Create plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All plans</CardTitle>
          <CardDescription>
            Sorted by display order. Inactive plans are hidden from the marketing page but
            still appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
            </div>
          ) : plans && plans.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Code</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Audience</th>
                    <th className="py-2">Price / year</th>
                    <th className="py-2">Highlights</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.code} className="border-t">
                      <td className="py-2 font-mono text-xs">{p.code}</td>
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 text-muted-foreground">
                        {PLAN_AUDIENCE_LABEL[p.audience]}
                      </td>
                      <td className="py-2">
                        {Number(p.priceYearly).toLocaleString()} {p.currency}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {p.highlights.length}
                      </td>
                      <td className="py-2">
                        {p.isActive ? (
                          <AdminStatusBadge tone="success">Active</AdminStatusBadge>
                        ) : (
                          <AdminStatusBadge tone="muted">Inactive</AdminStatusBadge>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(p)}
                            className="gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(p)}
                            className="gap-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                No plans yet — create one above and it will appear on{' '}
                <code>/for-business</code> and <code>/for-professionals</code>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Last refresh of the public <code>/plans</code> cache: {formatDate(new Date())}.
        Hard-refresh the marketing pages after editing to see changes immediately.
      </div>

      <ConfirmAction
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.code ?? 'plan'}?`}
        description={
          deleteTarget
            ? `Removes the ${deleteTarget.name} plan permanently. Plans with live subscriptions cannot be deleted — disable them instead.`
            : ''
        }
        confirmLabel="Delete plan"
        requireType={deleteTarget?.code}
        loading={del.isPending}
      />
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

function Field({ id, label, fullWidth, children }: FieldProps) {
  return (
    <div className={fullWidth ? 'md:col-span-3 space-y-1.5' : 'space-y-1.5'}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

interface ToggleProps {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function Toggle({ id, label, hint, checked, onChange }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-card"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-ring/25"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
