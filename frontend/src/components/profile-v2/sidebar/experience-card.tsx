'use client';

/**
 * ExperienceCard — sidebar card for the user's work experience.
 *
 * Owner can:
 *   • Add    — opens the dialog with an empty form
 *   • Edit   — opens the dialog pre-filled from the existing entry
 *   • Remove — trash icon next to each entry
 *
 * All operations mutate the *draft* via `onChange`; nothing hits the
 * database until the SectionCard footer's "Save N changes" is clicked.
 */

import { useEffect, useState } from 'react';
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SectionCard } from './section-card';
import type { ProfileV2Experience } from '@/lib/hooks/use-profile-v2';

export interface ExperienceCardProps {
  experience: ProfileV2Experience[];
  isOwner: boolean;
  isDirty: boolean;
  isSaving: boolean;
  dirtyCount: number;
  onChange: (next: ProfileV2Experience[]) => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
}

export function ExperienceCard({
  experience,
  isOwner,
  isDirty,
  isSaving,
  dirtyCount,
  onChange,
  onSave,
  onDiscard,
}: ExperienceCardProps) {
  const [dialogState, setDialogState] = useState<
    { open: true; editingId: string | null } | { open: false }
  >({ open: false });

  function openAdd() {
    setDialogState({ open: true, editingId: null });
  }
  function openEdit(id: string) {
    setDialogState({ open: true, editingId: id });
  }
  function closeDialog() {
    setDialogState({ open: false });
  }

  function handleSave(input: {
    role: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
  }) {
    if (!dialogState.open) return;
    if (dialogState.editingId === null) {
      const temp: ProfileV2Experience = {
        id: `tmp-exp-${Date.now()}`,
        role: input.role,
        company: input.company,
        logoUrl: null,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        position: experience.length,
      };
      onChange([...experience, temp]);
    } else {
      onChange(
        experience.map((e) =>
          e.id === dialogState.editingId
            ? {
                ...e,
                role: input.role,
                company: input.company,
                startDate: input.startDate,
                endDate: input.endDate,
                description: input.description,
              }
            : e,
        ),
      );
    }
    closeDialog();
  }

  function remove(id: string) {
    onChange(experience.filter((e) => e.id !== id));
  }

  const editing =
    dialogState.open && dialogState.editingId !== null
      ? (experience.find((e) => e.id === dialogState.editingId) ?? null)
      : null;

  return (
    <SectionCard
      title="Experience"
      icon={Briefcase}
      isOwner={isOwner}
      isDirty={isDirty}
      isSaving={isSaving}
      dirtyCount={dirtyCount}
      onSave={onSave}
      onDiscard={onDiscard}
    >
      {experience.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {isOwner ? 'Add where you have worked.' : 'No experience listed yet.'}
        </p>
      )}
      <ul className="space-y-3">
        {experience.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{entry.role}</p>
              <p className="text-xs text-muted-foreground">{entry.company}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatMonthYear(entry.startDate)} –{' '}
                {entry.endDate ? formatMonthYear(entry.endDate) : 'Present'}
              </p>
              {entry.description && (
                <p className="mt-1 whitespace-pre-line text-xs text-foreground/90">
                  {entry.description}
                </p>
              )}
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label={`Edit ${entry.role}`}
                  onClick={() => openEdit(entry.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${entry.role}`}
                  onClick={() => remove(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 gap-1.5"
          onClick={openAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          Add experience
        </Button>
      )}

      <ExperienceEditDialog
        open={dialogState.open}
        onOpenChange={(o) => (o ? null : closeDialog())}
        initial={editing}
        onSave={handleSave}
      />
    </SectionCard>
  );
}

function ExperienceEditDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ProfileV2Experience | null;
  onSave: (input: {
    role: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
  }) => void;
}) {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [description, setDescription] = useState('');

  // Re-seed whenever the dialog opens with a new `initial`.
  useEffect(() => {
    if (!open) return;
    setRole(initial?.role ?? '');
    setCompany(initial?.company ?? '');
    setStartDate(initial?.startDate ? toMonthInput(initial.startDate) : '');
    setEndDate(initial?.endDate ? toMonthInput(initial.endDate) : '');
    setCurrent(initial ? initial.endDate == null && initial.startDate != null : false);
    setDescription(initial?.description ?? '');
  }, [open, initial]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Edit experience' : 'Add experience'}
          </DialogTitle>
          <DialogDescription>
            Changes land in your draft — click &quot;Save changes&quot; on the card to commit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Role">
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={120}
              autoFocus={!initial}
            />
          </Field>
          <Field label="Company">
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={120}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start month">
              <Input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="End month">
              <Input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={current}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={current}
              onChange={(e) => {
                setCurrent(e.target.checked);
                if (e.target.checked) setEndDate('');
              }}
            />
            I currently work here
          </label>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!role.trim() || !company.trim() || !startDate) {
                  toast.error('Role, company, and start date are required.');
                  return;
                }
                const startIso = new Date(`${startDate}-01`).toISOString();
                const endIso =
                  current || !endDate ? null : new Date(`${endDate}-01`).toISOString();
                onSave({
                  role: role.trim(),
                  company: company.trim(),
                  startDate: startIso,
                  endDate: endIso,
                  description: description.trim() || null,
                });
              }}
            >
              {initial ? 'Save changes' : 'Add to draft'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function toMonthInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
