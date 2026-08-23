'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingInput } from '@/components/reviews/star-rating';
import { apiClient, extractError } from '@/lib/api/client';
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  REVIEW_MAX_CONTENT_LENGTH,
  REVIEW_MIN_CONTENT_LENGTH,
  REVIEW_OTP_LENGTH,
  REVIEW_MAX_TITLE_LENGTH,
} from '@credible/shared';
import { OtpInput } from './otp-input';

interface GuestReviewWizardProps {
  businessId: string;
  businessName: string;
  initialIdentifier?: string;
}

type Stage = 'otp' | 'compose' | 'done';

export function GuestReviewWizard({
  businessId,
  businessName,
  initialIdentifier,
}: GuestReviewWizardProps) {
  const [stage, setStage] = useState<Stage>('otp');
  const [identifier, setIdentifier] = useState(initialIdentifier ?? '');
  const [code, setCode] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestOtp = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/reviews/submit-otp', { businessId, identifier });
      return res.data as { sent: true; devCode?: string };
    },
    onSuccess: (data) => {
      toast.success(`Verification code sent to ${identifier}`);
      if (data?.devCode && process.env.NODE_ENV !== 'production') {
        toast.info(`Dev code: ${data.devCode}`, { duration: 30_000 });
      }
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setStage('compose');
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/reviews/guest', {
        businessId,
        identifier,
        code,
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
      } else if (code === 'INVALID_OTP') {
        toast.error('That code is incorrect or expired. Try again.');
        setStage('otp');
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

  if (stage === 'otp') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify it's you</CardTitle>
          <CardDescription>
            Enter your email or phone number. We'll send a {REVIEW_OTP_LENGTH}-digit code
            so you can post your review of {businessName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!identifier.trim()) return;
              requestOtp.mutate();
            }}
          >
            <div>
              <label htmlFor="identifier" className="text-sm font-medium">
                Email or phone
              </label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                disabled={requestOtp.isPending}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={requestOtp.isPending}
              disabled={!identifier.trim()}
            >
              Send verification code
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // stage === 'compose' — OTP + review on the same screen
  const trimmedContent = content.trim();
  const contentValid = trimmedContent.length >= REVIEW_MIN_CONTENT_LENGTH;
  const formValid = rating > 0 && contentValid && code.length === REVIEW_OTP_LENGTH;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Verification code</CardTitle>
          <CardDescription>
            Sent to <span className="font-medium">{identifier}</span>.{' '}
            {cooldown > 0 ? (
              <span>You can resend in {cooldown}s.</span>
            ) : (
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => requestOtp.mutate()}
                disabled={requestOtp.isPending}
              >
                Resend code
              </button>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpInput
            length={REVIEW_OTP_LENGTH}
            value={code}
            onChange={setCode}
            disabled={submit.isPending}
            invalid={submit.isError}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your review of {businessName}</CardTitle>
          <CardDescription>Tell others what stood out — good or bad.</CardDescription>
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
    </div>
  );
}