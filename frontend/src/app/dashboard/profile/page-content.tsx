'use client';

/**
 * Dashboard Profile page (client component).
 *
 * Composes the new profile-specific primitives (ProfileHeader,
 * DetailRow, AvatarUploadZone) on top of the existing dashboard
 * primitives (SectionCard, SectionCardHeader, ProfileCompletionCard,
 * MotionStagger) and the shared `useUserProfile` hook.
 *
 * The page is intentionally honest about what the backend can and
 * cannot do:
 *   - Read: full name, email, avatar, role, status, createdAt, phone
 *     (when the API starts returning it).
 *   - Write: first/last name only (PATCH /users/me is strict).
 *   - Email / password change → /forgot-password (the only existing flow).
 *   - Avatar upload → local preview only (no PATCH /users/me/avatar).
 *   - 2FA / sessions / login history → not rendered (backend doesn't
 *     support any of them).
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  ShieldCheck,
  User2,
} from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FriendlyError,
  friendlyMessage,
} from '@/components/ui/friendly-error';
import { MotionFadeUp, MotionStagger } from '@/components/ui/motion-primitives';
import { SectionCard, SectionCardHeader } from '@/components/dashboard/primitives/section-card';
import { SkeletonStack } from '@/components/dashboard/primitives/skeleton-stack';
import { ProfileCompletionCard } from '@/components/dashboard/overview/profile-completion-card';
import { ProfileHeader } from '@/components/dashboard/profile/profile-header';
import { DetailRow } from '@/components/dashboard/profile/detail-row';
import { AvatarUploadZone } from '@/components/dashboard/profile/avatar-upload-zone';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { refreshSessionUser } from '@/lib/auth/refresh-session-user';
import { useProfileCompletion } from '@/lib/hooks/use-profile-completion';

const profileUpdateSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(80, 'Keep it under 80 characters'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(80, 'Keep it under 80 characters'),
  })
  .strict();

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

const AVATAR_TRANSITION = { duration: 0.25, ease: 'easeOut' } as const;

export function DashboardProfileContent() {
  const qc = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { user, isLoading, isError, fullName, initials, memberSinceLabel, roleLabel, statusLabel, refetch } =
    useUserProfile();

  const completion = useProfileCompletion({
    user,
    business: null,
    professional: null,
  });

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = useMutation({
    mutationFn: async (values: ProfileUpdateInput) => {
      const res = await apiClient.patch<{
        success: true;
        data: { id: string; firstName: string | null; lastName: string | null; avatar: string | null };
      }>('/users/me', values);
      return res.data.data;
    },
    onSuccess: (updated) => {
      toast.success('Profile saved');
      refreshSessionUser({
        id: updated.id,
        firstName: updated.firstName ?? undefined,
        lastName: updated.lastName ?? undefined,
        avatar: updated.avatar ?? undefined,
      });
      qc.invalidateQueries({ queryKey: qk.users.me() });
      setEditDialogOpen(false);
    },
    onError: (err) => toast.error(friendlyMessage(err, 'profile')),
  });

  const onSubmit = form.handleSubmit((values) => save.mutate(values));

  // ────────────────────────────────────────────────────────────────────
  // Loading state — mirrors the new layout.
  // ────────────────────────────────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-2xl md:col-span-2" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <SkeletonStack count={2} height="h-44" />
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Error state — friendly banner with a manual retry.
  // ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <FriendlyError
          kind="profile"
          className="bg-card"
        />
        <div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Loaded state — the new layout.
  // ────────────────────────────────────────────────────────────────────
  return (
    <>
      <MotionStagger className="space-y-6">
        <ProfileHeader
          fullName={fullName}
          email={user.email}
          roleLabel={roleLabel}
          statusLabel={statusLabel}
          memberSinceLabel={memberSinceLabel}
          avatarUrl={user.avatar ?? null}
          avatarFallback={initials}
          onEditProfile={() => setEditDialogOpen(true)}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <MotionFadeUp className="md:col-span-2">
            <SectionCard className="h-full p-6">
              <SectionCardHeader
                eyebrow="Identity"
                title="Personal information"
                description="The name and contact details shown next to your reviews and on any page you own or manage."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditDialogOpen(true)}
                    className="gap-2"
                  >
                    <PencilLine className="h-4 w-4" /> Edit
                  </Button>
                }
              />

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={AVATAR_TRANSITION}
                className="mt-5 grid gap-1 sm:grid-cols-1"
              >
                <DetailRow
                  icon={<User2 className="h-4 w-4" />}
                  label="Full name"
                  tone="primary"
                  value={fullName}
                />
                <DetailRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  tone="secondary"
                  value={user.email}
                  description="Email changes require a verification step."
                  action={
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="h-auto gap-1 px-0 text-primary"
                    >
                      <Link href="/forgot-password">
                        Change <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  }
                />
                <DetailRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  tone="muted"
                  value={user.phone?.trim() ? user.phone : 'Not provided'}
                />
              </motion.div>
            </SectionCard>
          </MotionFadeUp>

          <MotionFadeUp delay={0.05} className="md:col-span-1">
            <ProfileCompletionCard
              percent={completion.percent}
              items={completion.items}
            />
          </MotionFadeUp>
        </div>

        <MotionFadeUp delay={0.1}>
          <SectionCard className="h-full p-6">
            <SectionCardHeader
              eyebrow="Security"
              title="Account & Security"
              description="The basics of your account. Email and password changes use our secure OTP recovery flow."
            />

            <div className="mt-5 grid gap-1">
              <DetailRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                tone="primary"
                value={user.email}
                description="Visible to the businesses you review."
                action={
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto gap-1 px-0 text-primary"
                  >
                    <Link href="/forgot-password">
                      Change <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                }
              />
              <DetailRow
                icon={<KeyRound className="h-4 w-4" />}
                label="Password"
                tone="secondary"
                value={<span aria-label="Password hidden">••••••••••••</span>}
                description="Last changed on signup. Use the recovery flow to set a new password."
                action={
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto gap-1 px-0 text-primary"
                  >
                    <Link href="/forgot-password">
                      Change <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                }
              />
              <DetailRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Account role"
                tone="success"
                value={roleLabel}
                description="Determines which dashboard areas you can access."
              />
              {statusLabel && (
                <DetailRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Account status"
                  tone="muted"
                  value={statusLabel}
                />
              )}
              {memberSinceLabel && (
                <DetailRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Member since"
                  tone="muted"
                  value={memberSinceLabel.replace(/^Member since\s+/i, '')}
                />
              )}
            </div>
          </SectionCard>
        </MotionFadeUp>

        <MotionFadeUp delay={0.15}>
          <SectionCard className="h-full p-6">
            <SectionCardHeader
              eyebrow="Profile photo"
              title="Change your avatar"
              description="Upload a photo to personalise your reviews and page presence."
            />
            <div className="mt-5">
              <AvatarUploadZone currentAvatarUrl={user.avatar ?? null} />
            </div>
          </SectionCard>
        </MotionFadeUp>
      </MotionStagger>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update the name shown next to your reviews. Your email is
              locked for security — use the recovery flow to change it.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-firstName">First name</Label>
                <Input
                  id="edit-firstName"
                  {...form.register('firstName')}
                  aria-invalid={!!form.formState.errors.firstName}
                />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lastName">Last name</Label>
                <Input
                  id="edit-lastName"
                  {...form.register('lastName')}
                  aria-invalid={!!form.formState.errors.lastName}
                />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="cursor-not-allowed bg-muted/40 pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Change your email
                </Link>{' '}
                via the secure recovery flow.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditDialogOpen(false)}
                disabled={save.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Save changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
