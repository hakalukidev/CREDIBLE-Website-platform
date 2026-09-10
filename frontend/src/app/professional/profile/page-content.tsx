'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfessionalProfileSetup } from '@/components/professional/professional-profile-setup';
import { ProfessionalProfileForm } from '@/features/professional/professional-profile-form';

export function ProfessionalProfilePageContent() {
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
      <div>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Set Up Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Create your professional profile to get started on Credible.
          </p>
        </header>
        <ProfessionalProfileSetup />
      </div>
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
      <ProfessionalProfileForm />
    </div>
  );
}
