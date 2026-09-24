'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardSection {
  id: number;
  label: string;
}

export interface WizardStepSidebarProps {
  sections: WizardSection[];
  step: number;
  lastStep: number;
  /** Override the step counter shown to the user (e.g. "Step 3 of 4"). */
  title?: string;
  description?: string;
  caption?: { title: string; body: string };
  /** Called when the user clicks a previously-completed step. */
  onStepClick?: (id: number) => void;
}

export function WizardStepSidebar({
  sections,
  step,
  lastStep,
  title,
  description,
  caption,
  onStepClick,
}: WizardStepSidebarProps) {
  return (
    <aside className="border-b border-border bg-muted/30 p-5 md:border-b-0 md:border-r">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Step {step} of {lastStep}
      </p>
      {title && (
        <p className="mt-2 font-display text-lg font-semibold tracking-tight">
          {title}
        </p>
      )}
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      <ol className="mt-5 space-y-1">
        {sections.map((s) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!done || !onStepClick}
                onClick={() => done && onStepClick?.(s.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : done
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : done
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : s.id}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {caption && (
        <div className="mt-5 rounded-xl border border-gold-200 bg-gold-grad p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">
            {caption.title}
          </p>
          <p className="mt-1 text-[12px] text-foreground">{caption.body}</p>
        </div>
      )}
    </aside>
  );
}
