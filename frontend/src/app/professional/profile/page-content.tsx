'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { qk } from '@/lib/api/query-keys';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfessionalProfileForm } from '@/features/professional/professional-profile-form';
import { VerificationCtaCard } from '@/features/verification/verification-cta-card';

/**
 * /professional/profile — the management surface for users who already own
 * a professional page. Users who don't yet have one are bounced back to
 * their general profile page where the "Switch to professional" flow lives
 * (no setup form belongs here — the general account IS the on-ramp).
 */
export function ProfessionalProfilePageContent() {
  const router = useRouter();
  const viewer = useCurrentUser();

  const { data: profile, isLoading } = useQuery({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: { id: string } }>(
        '/professionals/me/profile',
      );
      return res.data.data;
    },
    retry: false,
  });

  const handle = viewer?.username || viewer?.slug || viewer?.id;

  // No professional page → send the user to their general profile where the
  // "Switch to professional" CTA lives. Skip while we don't yet know who
  // the viewer is so we don't bounce signed-out visitors to a protected URL.
  useEffect(() => {
    if (isLoading) return;
    if (profile) return;
    if (!handle) return;
    router.replace(`/profile/${handle}` as never);
  }, [isLoading, profile, handle, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have a professional page yet. Switch to professional from
            your profile to create one.
          </p>
          {handle && (
            <Button asChild className="rounded-full">
              <Link href={`/profile/${handle}` as never}>Go to profile</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your public profile up to date so clients know exactly who you are.
        </p>
      </header>
      <VerificationCtaCard target="professional" />
      <ProfessionalProfileForm />
    </div>
  );
}
