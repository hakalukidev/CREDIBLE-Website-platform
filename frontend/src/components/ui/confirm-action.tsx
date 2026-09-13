'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

interface ConfirmActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** High-risk operations require the admin to type this phrase verbatim. */
  requireType?: string;
  loading?: boolean;
}

/**
 * Mandatory confirmation gate for destructive admin actions (delete, revoke,
 * suspend, refund). When `requireType` is provided the confirm button stays
 * disabled until the exact phrase is typed — a real safeguard against
 * one-click mistakes.
 */
export function ConfirmAction({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  requireType,
  loading,
}: ConfirmActionProps) {
  const [typed, setTyped] = useState('');
  const needsTyping = Boolean(requireType);
  const canConfirm = loading || !needsTyping || typed.trim() === requireType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {needsTyping && (
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">{requireType}</span> to
              confirm.
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireType}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canConfirm}
            onClick={() => {
              onConfirm();
              setTyped('');
            }}
          >
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}