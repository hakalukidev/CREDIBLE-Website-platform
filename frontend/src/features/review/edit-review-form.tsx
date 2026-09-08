'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { RatingInput } from '@/components/reviews/star-rating';
import { apiClient, extractError } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import {
  REVIEW_EDIT_WINDOW_HOURS,
  REVIEW_MAX_CONTENT_LENGTH,
  REVIEW_MAX_TITLE_LENGTH,
  REVIEW_MIN_CONTENT_LENGTH,
} from '@credible/shared';

interface EditReviewFormProps {
  reviewId: string;
  businessId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ReviewResponse {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string;
  editableUntil?: string | null;
  businessId: string;
}

export function EditReviewForm({
  reviewId,
  businessId,
  onSuccess,
  onCancel,
}: EditReviewFormProps) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk.reviews.ownerOne(reviewId),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ReviewResponse }>(
        `/reviews/${reviewId}`,
      );
      return res.data.data;
    },
  });

  // Populate state once the data arrives.
  useEffect(() => {
    if (data) {
      setRating(data.rating);
      setTitle(data.title ?? '');
      setContent(data.content);
    }
  }, [data]);

  const update = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/reviews/${reviewId}`, {
        rating,
        title: title || undefined,
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Review updated');
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: qk.reviews.ownerOne(reviewId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      onSuccess?.();
    },
    onError: (err) => {
      const { code } = extractError(err);
      if (code === 'EDIT_WINDOW_CLOSED') {
        toast.error(`The ${REVIEW_EDIT_WINDOW_HOURS}-hour edit window has closed.`);
      } else {
        toast.error(friendlyMessage(err, 'review-edit'));
      }
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isError
              ? friendlyMessage(error, 'review-edit')
              : 'Review not found.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const editable = data.editableUntil && new Date(data.editableUntil) > new Date();

  const contentValid = content.trim().length >= REVIEW_MIN_CONTENT_LENGTH;
  const formValid = rating > 0 && contentValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit your review</CardTitle>
        <CardDescription>
          {editable
            ? `You can edit this review until ${new Date(data.editableUntil!).toLocaleString()}.`
            : 'The edit window has closed.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!formValid || !editable) return;
            update.mutate();
          }}
        >
          <div>
            <label className="text-sm font-medium">Your rating</label>
            <div className="mt-2">
              <RatingInput value={rating} onChange={setRating} disabled={!editable || update.isPending} />
            </div>
          </div>
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Title (optional)
            </label>
            <Input
              id="title"
              value={title}
              maxLength={REVIEW_MAX_TITLE_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!editable || update.isPending}
            />
          </div>
          <div>
            <label htmlFor="content" className="text-sm font-medium">
              Your review
            </label>
            <Textarea
              id="content"
              rows={5}
              minLength={REVIEW_MIN_CONTENT_LENGTH}
              maxLength={REVIEW_MAX_CONTENT_LENGTH}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!editable || update.isPending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {content.length}/{REVIEW_MAX_CONTENT_LENGTH} characters
            </p>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={update.isPending}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              loading={update.isPending}
              disabled={!formValid || !editable}
            >
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}