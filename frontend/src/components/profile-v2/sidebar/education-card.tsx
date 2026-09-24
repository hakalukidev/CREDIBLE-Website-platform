'use client';

/**
 * EducationCard — sidebar card for the user's education list.
 *
 * Owner can:
 *   • Add    — opens the dialog with an empty form
 *   • Edit   — opens the dialog pre-filled from the existing entry
 *   • Remove — trash icon next to each entry
 *
 * All operations mutate the *draft* via `onChange`; nothing hits the
 * database until the SectionCard footer's "Save N changes" is clicked.
 *
 * Edit dialog supports both add and edit modes via the optional
 * `editingId` argument. The dialog resets its internal state whenever
 * it re-opens with a new initial value.
 */

import { useEffect, useState } from 'react';
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { ProfileV2Education } from '@/lib/hooks/use-profile-v2';

export interface EducationCardProps {
  education: ProfileV2Education[];
  isOwner: boolean;
  isDirty: boolean;
  isSaving: boolean;
  dirtyCount: number;
  onChange: (next: ProfileV2Education[]) => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
}

export function EducationCard({
  education,
  isOwner,
  isDirty,
  isSaving,
  dirtyCount,
  onChange,
  onSave,
  onDiscard,
}: EducationCardProps) {
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
    school: string;
    detail: string | null;
    startYear: number | null;
    endYear: number | null;
  }) {
    if (!dialogState.open) return;
    if (dialogState.editingId === null) {
      const temp: ProfileV2Education = {
        id: `tmp-edu-${Date.now()}`,
        school: input.school,
        detail: input.detail,
        startYear: input.startYear,
        endYear: input.endYear,
        position: education.length,
      };
      onChange([...education, temp]);
    } else {
      onChange(
        education.map((e) =>
          e.id === dialogState.editingId
            ? {
                ...e,
                school: input.school,
                detail: input.detail,
                startYear: input.startYear,
                endYear: input.endYear,
              }
            : e,
        ),
      );
    }
    closeDialog();
  }

  function remove(id: string) {
    onChange(education.filter((e) => e.id !== id));
  }

  const editing =
    dialogState.open && dialogState.editingId !== null
      ? (education.find((e) => e.id === dialogState.editingId) ?? null)
      : null;

  return (
    <SectionCard
      title="Education"
      icon={GraduationCap}
      isOwner={isOwner}
      isDirty={isDirty}
      isSaving={isSaving}
      dirtyCount={dirtyCount}
      onSave={onSave}
      onDiscard={onDiscard}
    >
      {education.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {isOwner ? 'Add where you studied.' : 'No education listed yet.'}
        </p>
      )}
      <ul className="space-y-3">
        {education.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{entry.school}</p>
              {entry.detail && (
                <p className="text-xs text-muted-foreground">{entry.detail}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {entry.startYear ?? '—'} – {entry.endYear ?? 'Present'}
              </p>
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label={`Edit ${entry.school}`}
                  onClick={() => openEdit(entry.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${entry.school}`}
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
          Add education
        </Button>
      )}

      <EducationEditDialog
        open={dialogState.open}
        onOpenChange={(o) => (o ? null : closeDialog())}
        initial={editing}
        onSave={handleSave}
      />
    </SectionCard>
  );
}

function EducationEditDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ProfileV2Education | null;
  onSave: (input: {
    school: string;
    detail: string | null;
    startYear: number | null;
    endYear: number | null;
  }) => void;
}) {
  const [school, setSchool] = useState('');
  const [detail, setDetail] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [current, setCurrent] = useState(false);

  // Re-seed the dialog whenever it opens with a new `initial`.
  useEffect(() => {
    if (!open) return;
    setSchool(initial?.school ?? '');
    setDetail(initial?.detail ?? '');
    setStartYear(initial?.startYear != null ? String(initial.startYear) : '');
    setEndYear(initial?.endYear != null ? String(initial.endYear) : '');
    setCurrent(initial ? initial.endYear == null && initial.startYear != null : false);
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
            {initial ? 'Edit education' : 'Add education'}
          </DialogTitle>
          <DialogDescription>
            Changes land in your draft — click &quot;Save changes&quot; on the card to commit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="School">
            <Input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              maxLength={120}
              autoFocus={!initial}
            />
          </Field>
          <Field label="Detail">
            <Input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. BA, Product Design"
              maxLength={120}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start year">
              <Input
                type="number"
                min={1900}
                max={2100}
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
              />
            </Field>
            <Field label="End year">
              <Input
                type="number"
                min={1900}
                max={2100}
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
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
                if (e.target.checked) setEndYear('');
              }}
            />
            I currently study here
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!school.trim()) {
                  toast.error('School is required.');
                  return;
                }
                onSave({
                  school: school.trim(),
                  detail: detail.trim() || null,
                  startYear: startYear ? Number(startYear) : null,
                  endYear: current || !endYear ? null : Number(endYear),
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
