'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { apiClient, extractError } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { REVIEW_MAX_CONTENT_LENGTH, REVIEW_MIN_CONTENT_LENGTH } from '@credible/shared';

interface ReviewResponseFormProps {
  reviewId: string;
  businessId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewResponseForm({
  reviewId,
  businessId,
  onSuccess,
  onCancel,
}: ReviewResponseFormProps) {
  const [content, setContent] = useState('');
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/businesses/me/reviews/${reviewId}/respond`, { content });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Response posted');
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: qk.reviews.ownerOne(reviewId) });
      if (businessId) {
        qc.invalidateQueries({ queryKey: qk.reviews.list(businessId, 1) });
      }
      setContent('');
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const trimmed = content.trim();
  const valid =
    trimmed.length >= REVIEW_MIN_CONTENT_LENGTH && trimmed.length <= REVIEW_MAX_CONTENT_LENGTH;

  return (
    <form
      className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        submit.mutate();
      }}
    >
      <label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={`response-${reviewId}`}
      >
        Your public response
      </label>
      <Textarea
        id={`response-${reviewId}`}
        value={content}
        rows={3}
        maxLength={REVIEW_MAX_CONTENT_LENGTH}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Address the reviewer's experience constructively…"
        disabled={submit.isPending}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {trimmed.length}/{REVIEW_MAX_CONTENT_LENGTH} characters
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={submit.isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!valid || submit.isPending} loading={submit.isPending}>
            Post response
          </Button>
        </div>
      </div>
    </form>
  );
}