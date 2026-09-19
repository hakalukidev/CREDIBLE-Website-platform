'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import {
  useEligibility,
  useVerificationStatus,
} from '@/features/verification/verification-hooks';
import { EligibilityPanel } from '@/features/verification/eligibility-panel';
import { ApplicationWizard } from '@/features/verification/application-wizard';
import { StatusTimeline } from '@/features/verification/status-timeline';
import { BadgeManagement } from '@/features/verification/badge-management';
import { AppealForm } from '@/features/verification/appeal-form';

interface BaseProps {
  variant?: 'page' | 'dialog';
}

interface DialogProps extends BaseProps {
  variant?: 'dialog';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageProps extends BaseProps {
  variant: 'page';
}

type Props = DialogProps | PageProps;

/**
 * Re-usable popup dialog that hosts the verification manager over the
 * dashboard. Falls back to a plain page rendering when `variant="page"` is
 * passed (used by `/business/verification` for direct-link / refresh support).
 */
export function VerificationDialog(props: Props) {
  const body = <VerificationBody />;

  if (props.variant === 'page') {
    return body;
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,1100px)] max-w-none overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Verification</DialogTitle>
          <DialogDescription>
            Earn the Credible Verified badge to unlock premium trust features.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function VerificationBody() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: { id: string; displayName: string };
      }>('/businesses/me/profile');
      return res.data.data;
    },
  });

  const businessId = profile?.id ?? null;
  const { data: eligibility, isLoading: eligibilityLoading } = useEligibility(
    'business',
    businessId,
  );
  const { data: status, isLoading: statusLoading } = useVerificationStatus(
    'business',
    businessId,
  );

  const [appealApplicationId, setAppealApplicationId] = useState<string | null>(
    null,
  );

  if (profileLoading || eligibilityLoading || statusLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Set up your business profile to start verification.
        </CardContent>
      </Card>
    );
  }

  const currentStatus = status?.status ?? 'NOT_STARTED';
  const isApproved = currentStatus === 'APPROVED';
  const isRejected = currentStatus === 'REJECTED';
  const application = status?.application ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="text-sm text-muted-foreground">
          Earn the Credible Verified badge to unlock premium trust features.
        </p>
      </header>

      {isApproved ? (
        <ApprovedView
          target="business"
          entityId={profile.id}
          applicationId={application?.id ?? null}
          entityName={profile.displayName}
        />
      ) : isRejected && application ? (
        <RejectedView
          target="business"
          entityId={profile.id}
          applicationId={application.id}
          reason={application.rejectionReason ?? 'No reason provided'}
          onAppeal={() => setAppealApplicationId(application.id)}
        />
      ) : application ? (
        <ActiveApplicationView
          target="business"
          entityId={profile.id}
          applicationId={application.id}
        />
      ) : eligibility ? (
        <EligibilityView
          target="business"
          entityId={profile.id}
          eligibility={eligibility}
        />
      ) : null}

      {appealApplicationId && (
        <AppealForm
          target="business"
          entityId={profile.id}
          applicationId={appealApplicationId}
          open={Boolean(appealApplicationId)}
          onOpenChange={(o) => !o && setAppealApplicationId(null)}
        />
      )}
    </div>
  );
}

function EligibilityView({
  target,
  entityId,
  eligibility,
}: {
  target: 'business' | 'professional';
  entityId: string;
  eligibility: ReturnType<typeof useEligibility>['data'];
}) {
  if (!eligibility) return null;
  return (
    <div className="space-y-4">
      <EligibilityPanel
        eligibility={eligibility}
        entityLabel={target === 'professional' ? 'professional' : 'business'}
      />
      {eligibility.eligible && (
        <ApplicationWizard
          target={target}
          entityId={entityId}
          onCreated={(app) => app}
        />
      )}
    </div>
  );
}

function ActiveApplicationView({
  target,
  entityId,
  applicationId,
}: {
  target: 'business' | 'professional';
  entityId: string;
  applicationId: string;
}) {
  return (
    <div className="space-y-4">
      <ApplicationWizard
        target={target}
        entityId={entityId}
        applicationId={applicationId}
      />
    </div>
  );
}

function ApprovedView({
  target,
  entityId,
  applicationId,
  entityName,
}: {
  target: 'business' | 'professional';
  entityId: string;
  applicationId: string | null;
  entityName: string;
}) {
  const isBusiness = target === 'business';
  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">You&apos;re verified</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-700">
          <p>
            <strong>{entityName}</strong> is now a Credible Verified{' '}
            {isBusiness ? 'business' : 'professional'}. The badge is already
            showing on your public profile.
          </p>
          <p className="text-xs">
            <Link
              href={`/verify/${entityId}`}
              className="underline hover:no-underline"
            >
              View your public verification page
            </Link>
          </p>
        </CardContent>
      </Card>
      {applicationId && (
        <StatusTimeline
          target={target}
          entityId={entityId}
          applicationId={applicationId}
        />
      )}
      <BadgeManagement target={target} entityId={entityId} />
    </div>
  );
}

function RejectedView({
  target,
  entityId,
  applicationId,
  reason,
  onAppeal,
}: {
  target: 'business' | 'professional';
  entityId: string;
  applicationId: string;
  reason: string;
  onAppeal: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">
            Application rejected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Reason:</strong> {reason}
          </p>
          <p className="text-muted-foreground">
            You can submit an appeal with a brief explanation. We&apos;ll
            re-review the case within 3 business days.
          </p>
          <div>
            <Button variant="default" onClick={onAppeal}>
              Submit an appeal
            </Button>
          </div>
        </CardContent>
      </Card>
      <StatusTimeline
        target={target}
        entityId={entityId}
        applicationId={applicationId}
      />
    </div>
  );
}
