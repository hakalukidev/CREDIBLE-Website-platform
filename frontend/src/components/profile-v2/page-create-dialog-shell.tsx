'use client';

/**
 * Shared chrome for the create-business / create-professional dialogs.
 * Owns the dialog wrapper, the WizardStepSidebar, the back/continue/submit
 * footer, and the review-row helper — the per-type dialog only renders the
 * step bodies and supplies the review rows.
 */

import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  WizardStepSidebar,
  type WizardSection,
} from '@/components/ui/wizard-step-sidebar';

export interface PageCreateDialogShellProps<S extends number> {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sections: WizardSection[];
  step: S;
  lastStep: S;
  withDocs: boolean;
  onStepClick: (id: S) => void;
  onBack: () => void;
  /** Called for step 1 → 2 to validate before advancing. */
  onContinue: () => void | Promise<void>;
  submitLabel: string;
  /** Form contents for the current step. */
  body: ReactNode;
}

export function PageCreateDialogShell<S extends number>({
  open,
  isPending,
  onOpenChange,
  title,
  sections,
  step,
  lastStep,
  withDocs,
  onStepClick,
  onBack,
  onContinue,
  submitLabel,
  body,
}: PageCreateDialogShellProps<S>) {
  const isReviewStep = (step as number) === (lastStep as number);
  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="max-w-2xl p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {/* Key forces a fresh internal state every time the dialog reopens
            so the user never sees stale data from a previous attempt. */}
        <div key={open ? 'open' : 'closed'} className="grid gap-0 md:grid-cols-[220px_1fr]">
          <WizardStepSidebar
            sections={sections}
            step={step as number}
            lastStep={lastStep as number}
            title={title}
            description={
              withDocs
                ? 'Includes identity, photos, and verification documents.'
                : 'You can add documents later from your dashboard.'
            }
            onStepClick={(id) => onStepClick(id as S)}
          />

          <div className="space-y-5 p-6">
            {body}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={(step as number) === 1 || isPending}
                className="gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <p className="text-xs text-muted-foreground">
                Step {step as number} of {sections.length}
              </p>
              {!isReviewStep ? (
                <Button
                  type="button"
                  onClick={() => void onContinue()}
                  className="gap-1.5"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gap-1.5"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {submitLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className="font-medium text-foreground">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </li>
  );
}

export const REQUIRED_DOCS = 3;
