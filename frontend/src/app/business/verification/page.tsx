'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import {
  useVerificationStatus,
  useEligibility,
} from '@/features/verification/verification-hooks';
import { EligibilityPanel } from '@/features/verification/eligibility-panel';
import { ApplicationWizard } from '@/features/verification/application-wizard';
import { StatusTimeline } from '@/features/verification/status-timeline';
import { BadgeManagement } from '@/features/verification/badge-management';
import { AppealForm } from '@/features/verification/appeal-form';
import { Button } from '@/components/ui/button';

export default function BusinessVerificationPage() {
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
  const { data: eligibility, isLoading: eligibilityLoading } = useEligibility(businessId);
  const { data: status, isLoading: statusLoading } = useVerificationStatus(businessId);

  const [appealApplicationId, setAppealApplicationId] = useState<string | null>(null);

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
          businessId={profile.id}
          applicationId={application?.id ?? null}
          businessName={profile.displayName}
        />
      ) : isRejected && application ? (
        <RejectedView
          businessId={profile.id}
          applicationId={application.id}
          reason={application.rejectionReason ?? 'No reason provided'}
          onAppeal={() => setAppealApplicationId(application.id)}
        />
      ) : application ? (
        <ActiveApplicationView businessId={profile.id} applicationId={application.id} />
      ) : eligibility ? (
        <EligibilityView
          businessId={profile.id}
          eligibility={eligibility}
        />
      ) : null}

      {appealApplicationId && (
        <AppealForm
          businessId={profile.id}
          applicationId={appealApplicationId}
          open={Boolean(appealApplicationId)}
          onOpenChange={(o) => !o && setAppealApplicationId(null)}
        />
      )}
    </div>
  );
}

function EligibilityView({
  businessId,
  eligibility,
}: {
  businessId: string;
  eligibility: ReturnType<typeof useEligibility>['data'];
}) {
  if (!eligibility) return null;
  return (
    <div className="space-y-4">
      <EligibilityPanel eligibility={eligibility} />
      {eligibility.eligible && (
        <ApplicationWizard
          businessId={businessId}
          onCreated={(app) => {
            // Wizard will navigate us forward via key change in URL hash — but
            // since the wizard state lives in this component, the parent
            // re-render happens automatically when the status query refreshes.
            return app;
          }}
        />
      )}
    </div>
  );
}

function ActiveApplicationView({
  businessId,
  applicationId,
}: {
  businessId: string;
  applicationId: string;
}) {
  return (
    <div className="space-y-4">
      <ApplicationWizard businessId={businessId} applicationId={applicationId} />
    </div>
  );
}

function ApprovedView({
  businessId,
  applicationId,
  businessName,
}: {
  businessId: string;
  applicationId: string | null;
  businessName: string;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">You're verified</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-700">
          <p>
            <strong>{businessName}</strong> is now a Credible Verified business. The badge is
            already showing on your public profile.
          </p>
          <p className="text-xs">
            <Link
              href={`/verify/${businessId}`}
              className="underline hover:no-underline"
            >
              View your public verification page
            </Link>
          </p>
        </CardContent>
      </Card>
      {applicationId && <StatusTimeline businessId={businessId} applicationId={applicationId} />}
      <BadgeManagement businessId={businessId} />
    </div>
  );
}

function RejectedView({
  businessId,
  applicationId,
  reason,
  onAppeal,
}: {
  businessId: string;
  applicationId: string;
  reason: string;
  onAppeal: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Application rejected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Reason:</strong> {reason}
          </p>
          <p className="text-muted-foreground">
            You can submit an appeal with a brief explanation. We'll re-review the case
            within 3 business days.
          </p>
          <div>
            <Button variant="default" onClick={onAppeal}>
              Submit an appeal
            </Button>
          </div>
        </CardContent>
      </Card>
      <StatusTimeline businessId={businessId} applicationId={applicationId} />
    </div>
  );
}
