'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { RatingInput } from '@/components/reviews/star-rating';
import { apiClient, extractError } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import {
  REVIEW_MAX_CONTENT_LENGTH,
  REVIEW_MAX_TITLE_LENGTH,
  REVIEW_MIN_CONTENT_LENGTH,
} from '@credible/shared';

interface ReviewFormProps {
  businessId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ businessId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/reviews`, {
        businessId,
        rating,
        title: title || undefined,
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Review submitted', { description: 'Thanks for sharing your experience.' });
      setRating(0);
      setTitle('');
      setContent('');
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      qc.invalidateQueries({ queryKey: ['business-search'] });
      onSubmitted?.();
    },
    onError: (err) => {
      const { code } = extractError(err);
      if (code === 'DUPLICATE_REVIEW') {
        toast.error('You already reviewed this business');
      } else {
        toast.error(friendlyMessage(err, 'generic'));
      }
    },
  });

  const contentValid = content.trim().length >= REVIEW_MIN_CONTENT_LENGTH;
  const formValid = rating > 0 && contentValid;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!formValid) return;
        submit.mutate();
      }}
    >
      <div>
        <label className="text-sm font-medium">Your rating</label>
        <div className="mt-2">
          <RatingInput value={rating} onChange={setRating} disabled={submit.isPending} />
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
          placeholder="Summarize your experience"
          disabled={submit.isPending}
        />
      </div>

      <div>
        <label htmlFor="content" className="text-sm font-medium">
          Your review
        </label>
        <Textarea
          id="content"
          value={content}
          rows={5}
          minLength={REVIEW_MIN_CONTENT_LENGTH}
          maxLength={REVIEW_MAX_CONTENT_LENGTH}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell others about your experience"
          disabled={submit.isPending}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {content.length}/{REVIEW_MAX_CONTENT_LENGTH} characters
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={!formValid} loading={submit.isPending}>
        {submit.isPending ? 'Submitting review…' : 'Submit review'}
      </Button>
    </form>
  );
}