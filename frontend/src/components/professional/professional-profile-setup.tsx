'use client';

import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  User2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Link2,
  Camera,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import { refreshSessionUser, refreshSessionTokens } from '@/lib/auth/refresh-session-user';
import {
  createProfessionalSchema,
  type CreateProfessionalInput,
} from '@credible/shared';
import { ProfileImageUpload } from '@/components/business/profile-image-upload';
import { ProfileCover, DEFAULT_COVER_GRADIENT } from './profile-cover';
import { cn } from '@/lib/utils';

interface ProfessionalResponse {
  id: string;
  ownerId: string;
  slug: string;
  title?: string | null;
  displayName: string;
  profession: string;
  headline?: string | null;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  country?: string | null;
  status: string;
}

interface ProfessionalSetupProps {
  onComplete?: () => void;
}

export function ProfessionalProfileSetup({ onComplete }: ProfessionalSetupProps) {
  const qc = useQueryClient();

  const { data: existingProfile, isLoading: profileLoading } = useQuery({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ProfessionalResponse }>(
        '/professionals/me/profile',
      );
      return res.data.data;
    },
    retry: false,
  });

  const notFound =
    !existingProfile &&
    !profileLoading;

  const form = useForm<CreateProfessionalInput>({
    resolver: zodResolver(createProfessionalSchema),
    defaultValues: {
      title: '',
      displayName: '',
      headline: '',
      bio: '',
      profession: '',
      email: '',
      phone: '',
      website: '',
      city: '',
      country: 'BD',
      avatar: '',
      coverImage: '',
    },
  });

  useEffect(() => {
    if (existingProfile) {
      form.reset({
        title: existingProfile.title ?? '',
        displayName: existingProfile.displayName ?? '',
        headline: existingProfile.headline ?? '',
        bio: existingProfile.bio ?? '',
        profession: existingProfile.profession ?? '',
        email: existingProfile.email ?? '',
        phone: existingProfile.phone ?? '',
        website: existingProfile.website ?? '',
        city: existingProfile.city ?? '',
        country: existingProfile.country ?? 'BD',
        avatar: existingProfile.avatar ?? '',
        coverImage: existingProfile.coverImage ?? '',
      });
    }
  }, [existingProfile?.id]);

  const create = useMutation({
    mutationFn: async (values: CreateProfessionalInput) => {
      const res = await apiClient.post<{
        success: true;
        data: {
          professional: { id: string };
          user: {
            id: string;
            email: string;
            role: string;
            firstName?: string;
            lastName?: string;
            avatar?: string;
          };
        };
      }>('/professionals', values);
      const created = res.data.data;

      await refreshSessionTokens();

      try {
        await apiClient.post<{ success: true; data: unknown }>(
          `/professionals/${created.professional.id}/publish`,
        );
      } catch {
        // Best-effort publish
      }

      return created;
    },
    onSuccess: ({ user }) => {
      toast.success('Professional profile created!');
      qc.invalidateQueries({ queryKey: qk.professionals.all() });
      if (user) refreshSessionUser(user);
      onComplete?.();
    },
    onError: (err) => {
      toast.error(friendlyMessage(err, 'profile'));
    },
  });

  const onSubmit: SubmitHandler<CreateProfessionalInput> = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    ) as CreateProfessionalInput;
    create.mutate(cleaned);
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!notFound && existingProfile) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold">Profile already exists!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your professional profile is set up. You can edit it from your profile page.
        </p>
        <Button asChild className="mt-6">
          <a href="/professional/profile">
            Go to Profile <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  const watchedValues = form.watch();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Stethoscope className="h-4 w-4" />
          Professional Profile Setup
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tell us about yourself
        </h1>
        <p className="text-muted-foreground">
          Complete your profile to help clients find and connect with you.
          This is a one-time setup — you can edit everything later.
        </p>
      </motion.div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Cover & Avatar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileCover
                value={watchedValues.coverImage || DEFAULT_COVER_GRADIENT}
                onChange={(val) => form.setValue('coverImage', val ?? '', { shouldDirty: true })}
              />
              <div className="flex items-start gap-4">
                <ProfileImageUpload
                  value={watchedValues.avatar || null}
                  namespace="public"
                  variant="avatar"
                  onChange={(r) => {
                    if (r) form.setValue('avatar', r.publicUrl, { shouldDirty: true });
                    else form.setValue('avatar', '', { shouldDirty: true });
                  }}
                />
                <div className="pt-4">
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">
                    Square photos work best. This appears on your public profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User2 className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Display Name *" error={form.formState.errors.displayName?.message}>
                  <Input {...form.register('displayName')} placeholder="e.g. Dr. Jane Doe" />
                </Field>
                <Field label="Profession *" error={form.formState.errors.profession?.message}>
                  <Input
                    {...form.register('profession')}
                    placeholder="e.g. Cardiologist, Tax Consultant"
                  />
                </Field>
              </div>
              <Field label="Headline" error={form.formState.errors.headline?.message}>
                <Input
                  {...form.register('headline')}
                  placeholder="One-sentence summary (appears under your name)"
                  maxLength={140}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {watchedValues.headline?.length ?? 0}/140 characters
                </p>
              </Field>
              <Field label="Bio" error={form.formState.errors.bio?.message}>
                <Textarea
                  rows={4}
                  {...form.register('bio')}
                  placeholder="Tell clients about your experience, approach, and what makes you unique..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {(watchedValues.bio?.length ?? 0)}/2000 characters
                </p>
              </Field>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Contact & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email" error={form.formState.errors.email?.message}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" {...form.register('email')} className="pl-9" placeholder="you@example.com" />
                  </div>
                </Field>
                <Field label="Phone" error={form.formState.errors.phone?.message}>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input {...form.register('phone')} className="pl-9" placeholder="+880 1XXXXXXXXX" />
                  </div>
                </Field>
              </div>
              <Field label="Website" error={form.formState.errors.website?.message}>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    {...form.register('website')}
                    className="pl-9"
                    placeholder="https://yoursite.com"
                  />
                </div>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="City" error={form.formState.errors.city?.message}>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input {...form.register('city')} className="pl-9" placeholder="Dhaka" />
                  </div>
                </Field>
                <Field label="Country" error={form.formState.errors.country?.message}>
                  <Input maxLength={2} {...form.register('country')} placeholder="BD" />
                </Field>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-3"
        >
          <Button type="button" variant="outline" onClick={onComplete}>
            Skip for now
          </Button>
          <Button type="submit" loading={create.isPending} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Create Profile
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

function Field({ label, error, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium">{label}</label>
      <div>{children}</div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
