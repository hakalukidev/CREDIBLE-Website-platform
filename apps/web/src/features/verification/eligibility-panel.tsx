'use client';

import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { EligibilityResponse } from './verification-hooks';

interface Props {
  eligibility: EligibilityResponse;
}

export function EligibilityPanel({ eligibility }: Props) {
  const { checks, eligible, alreadyVerified } = eligibility;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {eligible ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            <CardTitle>Eligibility check</CardTitle>
          </div>
          <Badge variant={eligible ? 'success' : 'secondary'}>
            {alreadyVerified
              ? 'Already verified'
              : eligible
                ? 'Eligible to apply'
                : 'Not yet eligible'}
          </Badge>
        </div>
        <CardDescription>
          Credible Verified is reserved for businesses that meet these quality thresholds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CheckRow
          label={`At least 5 published reviews (you have ${checks.reviewCount.actual})`}
          passed={checks.reviewCount.passed}
        />
        <CheckRow
          label={`Average rating ≥ 4.0 (currently ${Number(checks.avgRating.actual).toFixed(2)})`}
          passed={checks.avgRating.passed}
        />
        <CheckRow
          label={`Active paid subscription (current plan: ${checks.plan.plan ?? 'FREE'})`}
          passed={checks.plan.passed}
        />

        {!eligible && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Meet the criteria above to unlock verification. Most businesses qualify within a few
            weeks of consistent customer reviews.
          </p>
        )}

        <div>
          <p className="mb-1 text-xs text-muted-foreground">Eligibility score</p>
          <Progress value={eligible ? 100 : 50} />
        </div>
      </CardContent>
    </Card>
  );
}

function CheckRow({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-destructive" />
      )}
      <span className={passed ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
