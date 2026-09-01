'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingInput } from '@/components/reviews/star-rating';
import { apiClient, extractError } from '@/lib/api/client';
import {
  REVIEW_MAX_CONTENT_LENGTH,
  REVIEW_MIN_CONTENT_LENGTH,
  REVIEW_MAX_TITLE_LENGTH,
} from '@credible/shared';

interface GuestReviewWizardProps {
  businessId: string;
  businessName: string;
  professionalId?: string;
  initialIdentifier?: string;
}

type Stage = 'compose' | 'done';

export function GuestReviewWizard({
  businessId,
  businessName,
  professionalId,
  initialIdentifier,
}: GuestReviewWizardProps) {
  const [stage, setStage] = useState<Stage>('compose');
  const [identifier, setIdentifier] = useState(initialIdentifier ?? '');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/reviews/guest', {
        businessId: businessId || undefined,
        professionalId: professionalId || undefined,
        identifier,
        rating,
        title: title || undefined,
        content,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Review submitted — thanks for sharing your experience.');
      setStage('done');
    },
    onError: (err) => {
      const { code, message } = extractError(err);
      if (code === 'DUPLICATE_REVIEW') {
        toast.error('You have already reviewed this business.');
      } else {
        toast.error(message);
      }
    },
  });

  if (stage === 'done') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thanks for your review</CardTitle>
          <CardDescription>
            Your review of {businessName} has been published.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const trimmedContent = content.trim();
  const contentValid = trimmedContent.length >= REVIEW_MIN_CONTENT_LENGTH;
  const identifierValid = /@/.test(identifier) || /^\+?[0-9 ()-]{7,20}$/.test(identifier.trim());
  const formValid = rating > 0 && contentValid && identifierValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your review of {businessName}</CardTitle>
        <CardDescription>
          Share your experience. We use your email or phone to make sure one
          person posts one review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!formValid) return;
            submit.mutate();
          }}
        >
          <div>
            <label htmlFor="identifier" className="text-sm font-medium">
              Your email or phone
            </label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              disabled={submit.isPending}
            />
            {!identifierValid && identifier.length > 0 && (
              <p className="mt-1 text-xs text-destructive">
                Please enter a valid email or phone number.
              </p>
            )}
          </div>

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

          <Button
            type="submit"
            className="w-full"
            disabled={!formValid}
            loading={submit.isPending}
          >
            Submit review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}