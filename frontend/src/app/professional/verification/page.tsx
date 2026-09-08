'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export default function ProfessionalVerificationPage() {
  const { data: profile } = useQuery({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: { id: string; displayName: string; status: string };
      }>('/professionals/me/profile');
      return res.data.data;
    },
  });

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Set up your professional profile before applying for verification.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="text-sm text-muted-foreground">
          Earn the Credible Verified badge to unlock premium trust features.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Coming soon</CardTitle>
              <CardDescription>
                The full professional verification application flow lands in the next release. Until
                then, your published profile enjoys the baseline trust features.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/professional/profile">
              Edit profile <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Current status: <strong>{profile.status}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
