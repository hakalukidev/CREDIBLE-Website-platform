'use client';

/**
 * SkillsCard — sidebar card for the user's skill list.
 *
 * Owner can:
 *   • Add      — type into the inline input + press Enter or click "Add"
 *   • Reorder  — left/right chevrons on each pill (no drag-and-drop yet)
 *   • Remove   — `×` appears on hover
 *
 * All operations mutate the *draft* via `onChange`; nothing hits the
 * database until the SectionCard footer's "Save N changes" is clicked.
 */

import { useState } from 'react';
import { Sparkles, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionCard } from './section-card';
import type { ProfileV2Skill } from '@/lib/hooks/use-profile-v2';

export interface SkillsCardProps {
  skills: ProfileV2Skill[];
  isOwner: boolean;
  isDirty: boolean;
  isSaving: boolean;
  dirtyCount: number;
  onChange: (next: ProfileV2Skill[]) => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
}

const MAX_LABEL = 60;

export function SkillsCard({
  skills,
  isOwner,
  isDirty,
  isSaving,
  dirtyCount,
  onChange,
  onSave,
  onDiscard,
}: SkillsCardProps) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);

  function commitInput() {
    const label = input.trim();
    if (!label) return;
    if (label.length > MAX_LABEL) {
      toast.error(`Skills must be ${MAX_LABEL} characters or fewer.`);
      return;
    }
    if (skills.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      toast.error('That skill is already on your list.');
      return;
    }
    const temp: ProfileV2Skill = {
      id: `tmp-skill-${Date.now()}`,
      label,
      position: skills.length,
    };
    onChange([...skills, temp]);
    setInput('');
    setEditing(false);
  }

  function remove(id: string) {
    onChange(skills.filter((s) => s.id !== id));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= skills.length) return;
    const next = [...skills];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <SectionCard
      title="Skills"
      icon={Sparkles}
      isOwner={isOwner}
      isDirty={isDirty}
      isSaving={isSaving}
      dirtyCount={dirtyCount}
      onSave={onSave}
      onDiscard={onDiscard}
    >
      <div className="flex flex-wrap gap-1.5">
        {skills.length === 0 && !isOwner && (
          <p className="text-xs text-muted-foreground">No skills listed.</p>
        )}
        {skills.length === 0 && isOwner && (
          <p className="text-xs text-muted-foreground">
            Add skills you want to be known for.
          </p>
        )}
        {skills.map((skill, idx) => (
          <span
            key={skill.id}
            className="group inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            <span>{skill.label}</span>
            {isOwner && (
              <>
                <button
                  type="button"
                  aria-label="Move left"
                  onClick={() => move(idx, idx - 1)}
                  disabled={idx === 0}
                  className="grid h-4 w-4 place-items-center rounded-full text-primary/60 transition hover:bg-primary/20 hover:text-primary disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Move right"
                  onClick={() => move(idx, idx + 1)}
                  disabled={idx === skills.length - 1}
                  className="grid h-4 w-4 place-items-center rounded-full text-primary/60 transition hover:bg-primary/20 hover:text-primary disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Remove skill"
                  onClick={() => remove(skill.id)}
                  className="grid h-4 w-4 place-items-center rounded-full text-primary/60 transition hover:bg-primary/20 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </span>
        ))}
        {isOwner && !editing && skills.length < 30 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 rounded-full px-2.5 text-xs"
            onClick={() => setEditing(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add skill
          </Button>
        )}
      </div>

      {isOwner && editing && (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            commitInput();
          }}
        >
          <Input
            autoFocus
            placeholder="Type a skill, e.g. TypeScript"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setInput('');
                setEditing(false);
              }
            }}
            className="h-9"
            maxLength={MAX_LABEL}
          />
          <Button type="submit" size="sm" disabled={!input.trim()} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setInput('');
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </form>
      )}
    </SectionCard>
  );
}
