'use client';

/**
 * SwitchToProfessionalDialog — modal that asks the user whether they
 * want to upload verification documents up-front or skip them when
 * creating their professional page.
 *
 * Two cards mirror the style of the ProfileTypePicker used elsewhere
 * so the user sees a consistent decision UI.
 */

import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Sparkles,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SwitchMode } from './page-mode';

export type { SwitchMode };

export interface SwitchToProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (mode: SwitchMode) => void;
  busy?: boolean;
}

const OPTIONS: Array<{
  id: SwitchMode;
  title: string;
  subtitle: string;
  Icon: typeof Upload;
  recommended?: boolean;
}> = [
  {
    id: 'with-docs',
    title: 'Submit documents now',
    subtitle:
      'Upload your profile photo, cover photo, and verification documents in one go. Best for getting verified faster.',
    Icon: Upload,
    recommended: true,
  },
  {
    id: 'skip-docs',
    title: 'Submit later',
    subtitle:
      'Create a basic professional page now and upload documents from your dashboard when you are ready.',
    Icon: Clock3,
  },
];

export function SwitchToProfessionalDialog({
  open,
  onOpenChange,
  onChoose,
  busy = false,
}: SwitchToProfessionalDialogProps) {
  const [selected, setSelected] = useState<SwitchMode>('with-docs');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            Become a professional
          </span>
          <DialogTitle className="font-display text-2xl">
            Set up your professional page
          </DialogTitle>
          <DialogDescription>
            Showcase your skills and services under your own name. Verification documents
            help you earn trust badges faster, but they are optional at this step.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-3">
          <legend className="sr-only">Choose how to set up your professional page</legend>
          {OPTIONS.map((opt) => {
            const active = selected === opt.id;
            const Icon = opt.Icon;
            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                aria-pressed={active}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all',
                  active
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/30',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-foreground">
                      {opt.title}
                    </span>
                    {opt.recommended && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Recommended
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {opt.subtitle}
                  </span>
                </span>
                <span
                  className={cn(
                    'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-transparent',
                  )}
                  aria-hidden
                >
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              </motion.button>
            );
          })}
        </fieldset>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onChoose(selected)}
            disabled={busy}
            className="gap-1.5"
          >
            {selected === 'with-docs' ? 'Continue with documents' : 'Submit later'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
