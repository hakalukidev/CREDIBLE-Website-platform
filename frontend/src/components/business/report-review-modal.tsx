'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient, extractError } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { REVIEW_FLAG_REASONS } from '@credible/shared';
import { qk } from '@/lib/api/query-keys';

interface ReportReviewModalProps {
  reviewId: string;
  businessId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint?: string;
}

export function ReportReviewModal({
  reviewId,
  businessId,
  open,
  onOpenChange,
  endpoint,
}: ReportReviewModalProps) {
  const [reason, setReason] = useState<(typeof REVIEW_FLAG_REASONS)[number]>(REVIEW_FLAG_REASONS[0]);
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      const url = endpoint ?? `/businesses/me/reviews/${reviewId}/report`;
      const res = await apiClient.post(url, { reason, notes: notes || undefined });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Thanks — our moderators will review this.');
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: qk.reviews.ownerOne(reviewId) });
      if (businessId) {
        qc.invalidateQueries({ queryKey: qk.reviews.list(businessId, 1) });
      }
      onOpenChange(false);
      setNotes('');
    },
    onError: (err) => {
      const { code } = extractError(err);
      if (code === 'DUPLICATE_FLAG') {
        toast.error('You have already reported this review.');
      } else {
        toast.error(friendlyMessage(err, 'generic'));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this review</DialogTitle>
          <DialogDescription>
            Tell us what's wrong. Reports help our moderators keep reviews trustworthy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-medium" htmlFor="report-reason">
            Reason
          </label>
          <select
            id="report-reason"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value as (typeof REVIEW_FLAG_REASONS)[number])}
            disabled={submit.isPending}
          >
            {REVIEW_FLAG_REASONS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium" htmlFor="report-notes">
            Notes (optional)
          </label>
          <Input
            id="report-notes"
            value={notes}
            maxLength={500}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context for our moderators"
            disabled={submit.isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submit.isPending}
          >
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} loading={submit.isPending}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}