'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { VerificationStatusBanner } from './verification-status-banner';
import type { VerificationTarget } from './verification-hooks';

interface Props {
  target: VerificationTarget;
  /**
   * Optional click handler forwarded to the underlying
   * `VerificationStatusBanner`. When provided, the banner's CTA renders a
   * plain `<Button onClick>` instead of a `<Link>` so the host can intercept
   * the click — typically to open a popup dialog over the dashboard.
   */
  onCta?: () => void;
}

/**
 * Thin client wrapper that fetches the entity id from `/me/profile` and
 * delegates to the `VerificationStatusBanner`. The banner is shown above
 * the profile form on business / professional profile pages and inside the
 * business profile dialog.
 */
export function VerificationCtaCard({ target, onCta }: Props) {
  const isBusiness = target === 'business';
  const { data, isLoading } = useQuery({
    queryKey: isBusiness ? qk.businesses.me() : qk.professionals.me(),
    queryFn: async () => {
      const path = isBusiness
        ? '/businesses/me/profile'
        : '/professionals/me/profile';
      const res = await apiClient.get<{
        success: true;
        data: { id: string };
      }>(path);
      return res.data.data;
    },
    retry: false,
  });

  if (isLoading) {
    return <Skeleton className="h-20" />;
  }

  if (!data?.id) {
    return null;
  }

  return (
    <VerificationStatusBanner
      target={target}
      entityId={data.id}
      hideWhenApproved={false}
      onCta={onCta}
    />
  );
}

/**
 * Convenience: a one-card "next step" CTA. Renders nothing if the user is
 * already verified (the banner widget on dashboards handles that case).
 */
export function VerificationNextStepCard({ target, onCta }: Props) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-2 py-4">
        <p className="text-sm font-semibold">Complete your verification</p>
        <p className="text-xs text-muted-foreground">
          Upload the required documents and our team will review your application.
        </p>
        <VerificationCtaCard target={target} onCta={onCta} />
      </CardContent>
    </Card>
  );
}
