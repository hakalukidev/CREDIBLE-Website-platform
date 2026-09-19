'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  CircleAlert,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { apiClient } from '@/lib/api/client';
import { DocumentPreview } from '@/lib/documents/preview';
import {
  DOCUMENT_TYPE_LABELS,
  type VerificationDocument,
} from '@/features/verification/verification-hooks';

interface Props {
  applicationId: string;
  doc: VerificationDocument;
}

const STATUS_PILL: Record<
  string,
  { label: string; variant: 'success' | 'destructive' | 'secondary' | 'outline' | 'default' }
> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  UPLOADED: { label: 'Uploaded', variant: 'secondary' },
  EXTRACTED: { label: 'AI extracted', variant: 'secondary' },
  AUTO_APPROVED: { label: 'Approved by AI', variant: 'success' },
  AUTO_REJECTED: { label: 'Rejected by AI', variant: 'destructive' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  FLAGGED: { label: 'Flagged', variant: 'destructive' },
};

/**
 * Admin review card for a single verification document. Shows the document
 * preview, AI-extracted fields, AI flags, and per-document approve/reject
 * controls. Calls `PATCH .../documents/:documentId` on the admin verification
 * surface.
 */
export function DocumentReviewCard({ applicationId, doc }: Props) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: { status: 'APPROVED' | 'REJECTED'; reason?: string }) => {
      const res = await apiClient.patch<{
        success: true;
        data: VerificationDocument;
      }>(
        `/admin/verification/applications/${applicationId}/documents/${doc.id}`,
        input,
      );
      return res.data.data;
    },
    onSuccess: (updated) => {
      toast.success(
        updated.status === 'APPROVED'
          ? 'Document approved'
          : 'Document rejected',
      );
      setEditing(null);
      setReason('');
      qc.invalidateQueries({
        queryKey: ['verification', 'admin', 'application', applicationId],
      });
      qc.invalidateQueries({
        queryKey: ['verification', 'admin', 'list'],
      });
    },
    onError: (err) => {
      toast.error(friendlyMessage(err, 'verification'));
    },
  });

  const pill = STATUS_PILL[doc.status] ?? {
    label: doc.status,
    variant: 'outline' as const,
  };

  const extractedEntries = doc.extractedFields
    ? Object.entries(doc.extractedFields)
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {doc.originalName || 'document'}
              {doc.mimeType ? ` · ${doc.mimeType}` : ''}
              {doc.fileSize ? ` · ${Math.round(doc.fileSize / 1024)} KB` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={pill.variant}>{pill.label}</Badge>
            {doc.fileUrl && (
              <Button asChild variant="ghost" size="sm">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentPreview
          fileUrl={doc.fileUrl ?? ''}
          fileName={doc.originalName ?? null}
          mimeType={doc.mimeType ?? null}
          maxHeight={360}
        />

        {extractedEntries.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI extracted fields
            </p>
            <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {extractedEntries.map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="font-mono text-xs">
                    {typeof value === 'string' || typeof value === 'number'
                      ? String(value)
                      : JSON.stringify(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {doc.rejectionReason && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <CircleAlert className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Rejection reason</p>
              <p className="text-xs text-muted-foreground">{doc.rejectionReason}</p>
            </div>
          </div>
        )}

        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admin decision
          </p>
          {editing === null ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setEditing('APPROVED');
                  setReason('');
                }}
                disabled={mutation.isPending || doc.status === 'APPROVED'}
              >
                <ShieldCheck className="h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setEditing('REJECTED');
                  setReason('');
                }}
                disabled={mutation.isPending || doc.status === 'REJECTED'}
              >
                <ShieldOff className="h-4 w-4" /> Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="text-sm font-medium">
                  {editing === 'APPROVED'
                    ? 'Approve this document'
                    : 'Reject this document'}
                </p>
                {editing === 'REJECTED' && (
                  <div className="mt-2 space-y-2">
                    <Label htmlFor="reason">Reason (required)</Label>
                    <Textarea
                      id="reason"
                      rows={3}
                      placeholder="Explain why this document is being rejected so the owner has context."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 5 characters.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={editing === 'APPROVED' ? 'default' : 'destructive'}
                  loading={mutation.isPending}
                  disabled={
                    editing === 'REJECTED' && reason.trim().length < 5
                  }
                  onClick={() =>
                    mutation.mutate({
                      status: editing,
                      reason: editing === 'REJECTED' ? reason.trim() : undefined,
                    })
                  }
                >
                  {editing === 'APPROVED' ? (
                    <>
                      <Check className="h-4 w-4" /> Confirm approval
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" /> Confirm rejection
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setReason('');
                  }}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentReviewCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-3 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-40 w-full" />
      </CardContent>
    </Card>
  );
}
