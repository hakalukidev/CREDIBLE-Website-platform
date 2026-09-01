'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useVerificationApplication,
  type VerificationStatusKey,
} from './verification-hooks';

interface Props {
  businessId: string;
  applicationId: string;
}

const STATUS_LABEL: Record<VerificationStatusKey, string> = {
  NOT_STARTED: 'Not started',
  PENDING: 'Application submitted',
  DOCUMENTS_UPLOADED: 'Documents uploaded',
  AUTO_CHECKING: 'Automated checks',
  HUMAN_REVIEW_REQUIRED: 'Manual review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_VARIANT: Record<VerificationStatusKey, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  NOT_STARTED: 'outline',
  PENDING: 'secondary',
  DOCUMENTS_UPLOADED: 'secondary',
  AUTO_CHECKING: 'secondary',
  HUMAN_REVIEW_REQUIRED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

const ORDER: VerificationStatusKey[] = [
  'PENDING',
  'DOCUMENTS_UPLOADED',
  'AUTO_CHECKING',
  'HUMAN_REVIEW_REQUIRED',
  'APPROVED',
];

export function StatusTimeline({ businessId, applicationId }: Props) {
  const { data: app, isLoading } = useVerificationApplication(businessId, applicationId);

  if (isLoading) return <Skeleton className="h-48" />;
  if (!app) return null;

  const reached = new Set(app.statusHistory.map((h) => h.status));
  // Always include the current state so the user can see the latest.
  reached.add(app.status);
  const ordered = ORDER.filter((k) => reached.has(k));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Application progress</CardTitle>
            <CardDescription>
              Latest update:{' '}
              {new Date(
                app.statusHistory[app.statusHistory.length - 1]?.createdAt ?? app.appliedAt,
              ).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant={STATUS_VARIANT[app.status]}>{STATUS_LABEL[app.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {ordered.map((status) => {
            const entry = [...app.statusHistory]
              .reverse()
              .find((h) => h.status === status);
            return (
              <li key={status} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">{STATUS_LABEL[status]}</p>
                  {entry?.note && (
                    <p className="text-xs text-muted-foreground">{entry.note}</p>
                  )}
                  {entry && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {app.aiAnalysis && <AiAnalysisSummary ai={app.aiAnalysis} />}
      </CardContent>
    </Card>
  );
}

function AiAnalysisSummary({
  ai,
}: {
  ai: NonNullable<ReturnType<typeof useVerificationApplication>['data']>['aiAnalysis'];
}) {
  if (!ai) return null;
  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          AI analysis ({ai.modelUsed})
        </p>
        <Badge variant="outline">{ai.confidenceScore}% confidence</Badge>
      </div>
      {ai.summary && <p className="mt-1 text-sm">{ai.summary}</p>}
      {ai.flags.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {ai.flags.map((flag, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-2 ${
                flag.severity === 'high'
                  ? 'text-destructive'
                  : flag.severity === 'medium'
                    ? 'text-amber-700'
                    : 'text-muted-foreground'
              }`}
            >
              <span>•</span>
              <span>{flag.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
