'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { REVIEW_EDIT_WINDOW_HOURS } from '@credible/shared';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { ReviewForm } from './review-form';
import { GuestReviewWizard } from './guest-review-wizard';

interface SubmitReviewWizardProps {
  businessId: string;
  businessName: string;
}

interface ReviewStatus {
  hasReviewed: boolean;
  reviewDate?: string;
  reviewId?: string;
  canEdit?: boolean;
}

export function SubmitReviewWizard({ businessId, businessName }: SubmitReviewWizardProps) {
  const user = useCurrentUser();
  const isAuthed = Boolean(user);
  const [identifier, setIdentifier] = useState<string | undefined>(undefined);

  // If the reviewer is anonymous, we still let them check whether they've
  // already submitted a review (they provide an identifier in step 1).
  const { data: status, isLoading } = useQuery({
    queryKey: identifier
      ? qk.reviews.status(businessId, identifier)
      : ['reviews', 'status', businessId, 'none'],
    enabled: !isAuthed && Boolean(identifier),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ReviewStatus }>(
        `/reviews/status?businessId=${encodeURIComponent(businessId)}&identifier=${encodeURIComponent(identifier!)}`,
      );
      return res.data.data;
    },
  });

  // Logged-in customer — direct compose form (with duplicate guard)
  if (isAuthed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave a review</CardTitle>
          <CardDescription>
            You can edit your review within {REVIEW_EDIT_WINDOW_HOURS} hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewForm businessId={businessId} />
        </CardContent>
      </Card>
    );
  }

  // Guest — check status if they've started
  if (identifier && isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (status?.hasReviewed) {
    const editable = status.canEdit;
    return (
      <Card>
        <CardHeader>
          <CardTitle>You've already reviewed {businessName}</CardTitle>
          <CardDescription>
            Submitted on{' '}
            {status.reviewDate ? new Date(status.reviewDate).toLocaleDateString() : '—'}.
            {editable
              ? ' You can edit it within 24 hours of submission.'
              : ' Editing is now closed.'}
          </CardDescription>
        </CardHeader>
        {editable && status.reviewId && (
          <CardContent>
            <Button asChild>
              <Link href={`/business/reviews/${status.reviewId}`}>Edit your review</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  if (identifier && status && !status.hasReviewed) {
    // Continue with the wizard
    return (
      <GuestReviewWizard
        businessId={businessId}
        businessName={businessName}
        initialIdentifier={identifier}
      />
    );
  }

  // Initial gate — ask for the reviewer's email/phone up-front so we can
  // detect duplicates without consuming an OTP.
  return <IdentifierGate onSubmit={setIdentifier} />;
}

interface IdentifierGateProps {
  onSubmit: (id: string) => void;
}

function IdentifierGate({ onSubmit }: IdentifierGateProps) {
  const [value, setValue] = useState('');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a review</CardTitle>
        <CardDescription>
          Enter your email or phone so we can prevent duplicate reviews and send you
          a one-time verification code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim().length >= 3) onSubmit(value.trim());
          }}
        >
          <label htmlFor="gate-id" className="text-sm font-medium">
            Email or phone
          </label>
          <input
            id="gate-id"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="you@example.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" className="w-full" disabled={value.trim().length < 3}>
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}