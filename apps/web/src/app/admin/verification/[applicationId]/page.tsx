'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminAiAnalysis,
  useAdminApplication,
  useDecideApplication,
  useRevokeBadge,
} from '@/features/admin/admin-verification-hooks';
import {
  DOCUMENT_TYPE_LABELS,
  type VerificationLevel,
  type VerificationStatusKey,
} from '@/features/verification/verification-hooks';

const STATUS_BADGE: Record<VerificationStatusKey, 'secondary' | 'success' | 'destructive' | 'default'> = {
  NOT_STARTED: 'secondary',
  PENDING: 'secondary',
  DOCUMENTS_UPLOADED: 'secondary',
  AUTO_CHECKING: 'default',
  HUMAN_REVIEW_REQUIRED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

export default function AdminApplicationDetailPage({
  params,
}: {
  params: { applicationId: string };
}) {
  const { applicationId } = params;
  const app = useAdminApplication(applicationId);
  const ai = useAdminAiAnalysis(applicationId);
  const decide = useDecideApplication(applicationId);
  const revoke = useRevokeBadge();

  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [badgeType, setBadgeType] = useState<VerificationLevel>('BASIC');
  const [notes, setNotes] = useState('');

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  if (app.isLoading) return <Skeleton className="h-64" />;
  if (!app.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Application not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/verification">
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
        </Button>
      </div>
    );
  }

  const isOpen = app.data.status === 'AUTO_CHECKING' || app.data.status === 'HUMAN_REVIEW_REQUIRED' || app.data.status === 'DOCUMENTS_UPLOADED';
  const isApproved = app.data.status === 'APPROVED';

  const onDecide = () => {
    if (decision === 'REJECT' && reason.trim().length < 5) return;
    decide.mutate(
      {
        decision,
        reason: decision === 'REJECT' ? reason : undefined,
        badgeType: decision === 'APPROVE' ? badgeType : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setReason('');
          setNotes('');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/verification">
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
        </Button>
        <Badge variant={STATUS_BADGE[app.data.status]}>{app.data.status.replace(/_/g, ' ')}</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{app.data.business?.displayName ?? app.data.businessId}</CardTitle>
              <CardDescription>
                Applied {new Date(app.data.appliedAt).toLocaleString()} ·{' '}
                Level <strong>{app.data.level}</strong> · Type <strong>{app.data.type}</strong>
              </CardDescription>
            </div>
            {app.data.business?.slug && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/business/${app.data.business.slug}`} target="_blank">
                  View public profile <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documents ({app.data.documents.length})</CardTitle>
            <CardDescription>
              Click any document to open the original (admin-only).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {app.data.documents.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}
            {app.data.documents.map((d) => (
              <a
                key={d.id}
                href={`/admin/verification/documents/${d.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-accent"
              >
                <span>
                  <strong>{DOCUMENT_TYPE_LABELS[d.type]}</strong>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {d.status.toLowerCase()}
                  </span>
                </span>
                <span className="text-xs text-primary">Open ↗</span>
              </a>
            ))}
          </CardContent>
        </Card>

        <AiAnalysisCard ai={ai.data} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
          <CardDescription>
            Approving issues a Credible Verified badge. Rejecting requires a reason and
            can be appealed by the business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOpen ? (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={decision === 'APPROVE' ? 'default' : 'outline'}
                  onClick={() => setDecision('APPROVE')}
                >
                  <ShieldCheck className="h-4 w-4" /> Approve
                </Button>
                <Button
                  type="button"
                  variant={decision === 'REJECT' ? 'destructive' : 'outline'}
                  onClick={() => setDecision('REJECT')}
                >
                  <ShieldAlert className="h-4 w-4" /> Reject
                </Button>
              </div>

              {decision === 'APPROVE' && (
                <div className="grid gap-2">
                  <Label htmlFor="badgeType">Badge level</Label>
                  <select
                    id="badgeType"
                    value={badgeType}
                    onChange={(e) => setBadgeType(e.target.value as VerificationLevel)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="CERTIFIED">CERTIFIED</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                </div>
              )}

              {decision === 'REJECT' && (
                <div className="grid gap-2">
                  <Label htmlFor="reason">Rejection reason (required)</Label>
                  <Textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this application is not approved."
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Internal notes (optional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Visible to other admins only."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={onDecide}
                  loading={decide.isPending}
                  disabled={decision === 'REJECT' && reason.trim().length < 5}
                >
                  Confirm {decision.toLowerCase()}
                </Button>
              </div>
            </>
          ) : isApproved ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This business is currently verified. You can revoke the badge if the
                business is no longer trustworthy.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setRevokeOpen(true)}
              >
                <ShieldAlert className="h-4 w-4" /> Revoke badge
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This application has been {app.data.status.toLowerCase()} and cannot be
              modified directly.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Revoke badge</DialogTitle>
            <DialogDescription>
              Revoking immediately removes the badge from the public profile and the
              embed widget. This action is logged.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (revokeReason.trim().length < 5) return;
              revoke.mutate(
                { businessId: app.data!.businessId, reason: revokeReason },
                {
                  onSuccess: () => {
                    setRevokeOpen(false);
                    setRevokeReason('');
                  },
                },
              );
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="revoke-reason">Reason</Label>
              <Textarea
                id="revoke-reason"
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Why is this badge being revoked?"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRevokeOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                loading={revoke.isPending}
                disabled={revokeReason.trim().length < 5}
              >
                Revoke
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AiAnalysisCard({
  ai,
}: {
  ai: ReturnType<typeof useAdminAiAnalysis>['data'];
}) {
  if (!ai) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI analysis</CardTitle>
          <CardDescription>Not yet processed.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI analysis</CardTitle>
          <Badge variant="outline">{ai.confidenceScore}% confidence</Badge>
        </div>
        <CardDescription>Model: {ai.modelUsed}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {ai.summary && <p>{ai.summary}</p>}
        {ai.flags.length > 0 && (
          <ul className="space-y-1">
            {ai.flags.map((f, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2 ${
                  f.severity === 'high'
                    ? 'text-destructive'
                    : f.severity === 'medium'
                      ? 'text-amber-700'
                      : 'text-muted-foreground'
                }`}
              >
                <span>•</span>
                <span>{f.message}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-md border border-border bg-muted/30 p-2">
          <p className="text-xs uppercase text-muted-foreground">Suggested</p>
          <p className="font-medium">{ai.suggestedDecision}</p>
        </div>
      </CardContent>
    </Card>
  );
}