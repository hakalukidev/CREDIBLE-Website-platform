// app/account/profile/page-content.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, KeyRound, Camera, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { useSession } from '@/lib/store/session';
import { refreshSessionUser } from '@/lib/auth/refresh-session-user';
import { MotionFadeUp } from '@/components/ui/motion-primitives';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(80),
    lastName: z.string().trim().min(1, 'Last name is required').max(80),
  })
  .strict();

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export function AccountProfileContent() {
  const router = useRouter();
  const session = useSession((s) => s.session);

  // The shell already guards against anonymous users, but if a session
  // is cleared while this panel is mounted we still want to redirect
  // rather than show a "load failed" error.
  useEffect(() => {
    if (!session) router.replace('/login?next=/account');
  }, [session, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: {
          id: string;
          email: string;
          firstName?: string | null;
          lastName?: string | null;
          avatar?: string | null;
          role: string;
        };
      }>('/users/me');
      return res.data.data;
    },
    retry: false,
  });

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const save = useMutation({
    mutationFn: async (values: ProfileUpdateInput) => {
      const res = await apiClient.patch<{ success: true; data: typeof data }>(
        '/users/me',
        values,
      );
      return res.data.data;
    },
    onSuccess: (user) => {
      toast.success('Profile saved');
      if (user) {
        refreshSessionUser({
          id: user.id,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          avatar: user.avatar ?? undefined,
        });
      }
    },
    onError: (err) => toast.error(friendlyMessage(err, 'profile')),
  });

  const onSubmit = form.handleSubmit((values) => save.mutate(values));

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const initials =
    [data.firstName, data.lastName]
      .filter(Boolean)
      .map((s) => (s as string).charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || 'U';

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <MotionFadeUp className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile photo</CardTitle>
            <CardDescription>
              Shown next to your reviews and on any business or professional
              page you own.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Avatar className="h-24 w-24 ring-1 ring-black/5">
              {data.avatar ? (
                <AvatarImage src={data.avatar} alt={data.firstName ?? data.email} />
              ) : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" disabled>
              <Camera className="h-4 w-4" />
              Change photo
            </Button>
            <p className="text-xs text-muted-foreground">
              Avatar upload is being rebuilt — check back soon.
            </p>
          </CardContent>
        </Card>
      </MotionFadeUp>

      <MotionFadeUp delay={0.05} className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
            <CardDescription>
              These are shown publicly when you write a review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...form.register('firstName')} />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...form.register('lastName')} />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    readOnly
                    className="pl-10 bg-muted/40 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Changing your email requires a verification step — contact support.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <Link href="/forgot-password">
                    <KeyRound className="h-4 w-4" />
                    Change password
                  </Link>
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </MotionFadeUp>
    </div>
  );
}
