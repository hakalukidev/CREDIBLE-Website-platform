'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminReview,
  useAdminRespondReview,
  useResolveReviewFlag,
  useForceReviewStatus,
} from '@/features/admin/admin-reviews-hooks';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminReviewDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data: review, isLoading } = useAdminReview(id);
  const respond = useAdminRespondReview();
  const resolveFlag = useResolveReviewFlag();
  const force = useForceReviewStatus();

  const [response, setResponse] = useState('');
  const [reason, setReason] = useState('');

  if (isLoading || !review) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading review…
      </div>
    );
  }

  const onRespond = async () => {
    if (response.length < 5) return;
    await respond.mutateAsync({ id, message: response });
    setResponse('');
  };

  const onForce = async (status: 'PUBLISHED' | 'HIDDEN' | 'PENDING_MODERATION') => {
    if (reason.length < 3) return;
    await force.mutateAsync({ id, status, reason });
    setReason('');
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Review by {review.user.firstName ?? review.user.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(review.createdAt)} · {review.targetType === 'BUSINESS' ? review.business?.displayName : review.professional?.displayName} ·{' '}
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">{review.rating}★</span>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {review.title ? <p className="font-medium">{review.title}</p> : null}
          <p className="whitespace-pre-wrap">{review.content}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flags ({review.flags.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {review.flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flags.</p>
          ) : (
            review.flags.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <div className="font-medium">{f.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    by {f.flaggedBy.email} · {formatDate(f.createdAt)}
                    {f.resolvedAt ? ` · resolved ${formatDate(f.resolvedAt)}` : ''}
                  </div>
                </div>
                {!f.resolvedAt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolveFlag.isPending}
                    onClick={() =>
                      resolveFlag.mutate({ reviewId: id, flagId: f.id })
                    }
                  >
                    Resolve
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-700">Resolved</span>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {review.adminResponse ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="text-xs text-muted-foreground">
                {review.adminRespondedBy?.email} · {review.adminRespondedAt ? formatDate(review.adminRespondedAt) : ''}
              </div>
              <p className="mt-1 whitespace-pre-wrap">{review.adminResponse}</p>
            </div>
          ) : null}
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Write an official response that will appear below the review…"
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <Button onClick={onRespond} disabled={response.length < 5 || respond.isPending}>
            Post response
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Force status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="Reason (required, ≥ 3 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={reason.length < 3 || force.isPending}
              onClick={() => onForce('PUBLISHED')}
            >
              Force publish
            </Button>
            <Button
              variant="outline"
              disabled={reason.length < 3 || force.isPending}
              onClick={() => onForce('HIDDEN')}
            >
              Force hide
            </Button>
            <Button
              variant="outline"
              disabled={reason.length < 3 || force.isPending}
              onClick={() => onForce('PENDING_MODERATION')}
            >
              Force moderate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}