'use client';

/**
 * SectionCard — reusable shell for any sidebar card on `/profile/[username]`.
 *
 * Responsibilities:
 *   • Render the `Card` primitive with a consistent header (icon + title)
 *   • Show a "X changes" count badge in the header when the section is dirty
 *   • Animate a sticky footer (Discard + Save N changes) into view
 *     via framer-motion `AnimatePresence` whenever the section is dirty
 *
 * All persistence lives in the parent (`useProfileDraft`); this
 * component is purely presentational.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  /** Total unsaved changes — used for the "Save N changes" label. */
  dirtyCount: number;
  /** True if there are unsaved changes (controls footer visibility). */
  isDirty: boolean;
  /** True if a save is in flight (disables Save + shows spinner label). */
  isSaving: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  isOwner: boolean;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  icon: Icon,
  dirtyCount,
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  isOwner,
  children,
}: SectionCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <h3 className="font-display text-sm font-semibold tracking-tight">
            {title}
          </h3>
        </div>
        {isOwner && isDirty && (
          <span
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
            aria-label={`${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}`}
          >
            {dirtyCount} new
          </span>
        )}
      </div>

      <div className="px-5 py-4">{children}</div>

      <AnimatePresence initial={false}>
        {isOwner && isDirty && (
          <motion.div
            key="save-footer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border/60 bg-muted/30"
          >
            <div className="flex items-center justify-end gap-2 px-5 py-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onDiscard}
                disabled={isSaving}
              >
                Discard
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void onSave()}
                disabled={isSaving}
                className="gap-1.5"
              >
                {isSaving
                  ? 'Saving…'
                  : `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
