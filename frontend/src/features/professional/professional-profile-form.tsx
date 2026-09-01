'use client';

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, extractError } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
  type CreateProfessionalInput,
  type UpdateProfessionalInput,
} from '@credible/shared';
import { ProfileImageUpload } from '@/components/business/profile-image-upload';
import { Briefcase } from 'lucide-react';

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

interface ProfessionalResponse {
  id: string;
  ownerId: string;
  slug: string;
  title?: string | null;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  profession: string;
  specialties: string[];
  yearsOfExperience?: number | null;
  languages: string[];
  avatar?: string | null;
  coverImage?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  category?: { id: string; name: string } | null;
  status: string;
}

export function ProfessionalProfileForm() {
  const qc = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
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
    error && (error as { response?: { status?: number } })?.response?.status === 404;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (notFound) {
    return <CreateProfessionalForm />;
  }

  if (error && !notFound) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          {extractError(error).message}
        </CardContent>
      </Card>
    );
  }

  return <EditProfessionalProfile />;
}

function CreateProfessionalForm() {
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: qk.categories.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: CategoryOption[] }>(
        '/categories',
      );
      return res.data.data;
    },
  });

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
    },
  });

  const create = useMutation({
    mutationFn: async (values: CreateProfessionalInput) => {
      const res = await apiClient.post<{ success: true; data: { id: string } }>(
        '/professionals',
        values,
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Professional profile created!');
      qc.invalidateQueries({ queryKey: qk.professionals.me() });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const onSubmit: SubmitHandler<CreateProfessionalInput> = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    ) as CreateProfessionalInput;
    create.mutate(cleaned);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Create your professional profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Solo practitioners (doctors, lawyers, consultants, freelancers) — share what you do,
              where, and how clients can reach you.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Display name *" error={form.formState.errors.displayName?.message}>
            <Input {...form.register('displayName')} placeholder="e.g. Dr. Jane Doe" />
          </Field>
          <Field label="Profession *" error={form.formState.errors.profession?.message}>
            <Input
              {...form.register('profession')}
              placeholder="e.g. Cardiologist, Tax Consultant, UI Designer"
            />
          </Field>
          <Field label="Headline (140 chars)" error={form.formState.errors.headline?.message}>
            <Input
              {...form.register('headline')}
              placeholder="One-sentence summary that appears under your name"
            />
          </Field>
          <Field label="Bio (max 2000 chars)" error={form.formState.errors.bio?.message}>
            <Textarea rows={5} {...form.register('bio')} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input {...form.register('phone')} placeholder="+880 1XXXXXXXXX" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City" error={form.formState.errors.city?.message}>
              <Input {...form.register('city')} />
            </Field>
            <Field label="Country" error={form.formState.errors.country?.message}>
              <Input maxLength={2} {...form.register('country')} />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={create.isPending}>
              Create profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditProfessionalProfile() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ProfessionalResponse }>(
        '/professionals/me/profile',
      );
      return res.data.data;
    },
  });
  const { data: categories } = useQuery({
    queryKey: qk.categories.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: CategoryOption[] }>('/categories');
      return res.data.data;
    },
  });

  const form = useForm<UpdateProfessionalInput>({
    resolver: zodResolver(updateProfessionalSchema),
    defaultValues: {
      displayName: '',
      headline: '',
      bio: '',
      profession: '',
      email: '',
      phone: '',
      website: '',
      city: '',
      country: 'BD',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        title: profile.title ?? '',
        displayName: profile.displayName ?? '',
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        profession: profile.profession ?? '',
        specialties: profile.specialties ?? [],
        languages: profile.languages ?? [],
        yearsOfExperience: profile.yearsOfExperience ?? undefined,
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        website: profile.website ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        country: profile.country ?? 'BD',
        avatar: profile.avatar ?? '',
        coverImage: profile.coverImage ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const save = useMutation({
    mutationFn: async (values: UpdateProfessionalInput) => {
      const res = await apiClient.patch<{ success: true; data: ProfessionalResponse }>(
        '/professionals/me/profile',
        values,
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: qk.professionals.me() });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const onSubmit: SubmitHandler<UpdateProfessionalInput> = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    ) as UpdateProfessionalInput;
    save.mutate(cleaned);
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Display name" error={form.formState.errors.displayName?.message}>
            <Input {...form.register('displayName')} />
          </Field>
          <Field label="Profession" error={form.formState.errors.profession?.message}>
            <Input {...form.register('profession')} />
          </Field>
          <Field label="Headline" error={form.formState.errors.headline?.message} className="md:col-span-2">
            <Input {...form.register('headline')} />
          </Field>
          <Field label="Bio" error={form.formState.errors.bio?.message} className="md:col-span-2">
            <Textarea rows={5} {...form.register('bio')} />
          </Field>
          <Field label="Title (e.g. Dr., Sr., Jr.)" error={form.formState.errors.title?.message}>
            <Input {...form.register('title')} />
          </Field>
          <Field
            label="Years of experience"
            error={form.formState.errors.yearsOfExperience?.message}
          >
            <Input
              type="number"
              {...form.register('yearsOfExperience', { valueAsNumber: true })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload a profile photo and cover image. Both are optional but the profile photo really
            helps people recognise you.
          </p>
          <div className="flex flex-wrap gap-6">
            <ProfileImageUpload
              value={profile?.avatar ?? null}
              namespace="public"
              variant="avatar"
              onChange={(r) => {
                if (r) form.setValue('avatar', r.publicUrl, { shouldDirty: true });
                else form.setValue('avatar', '', { shouldDirty: true });
              }}
            />
            <div className="flex-1 min-w-[16rem]">
              <ProfileImageUpload
                value={profile?.coverImage ?? null}
                namespace="public"
                variant="cover"
                onChange={(r) => {
                  if (r) form.setValue('coverImage', r.publicUrl, { shouldDirty: true });
                  else form.setValue('coverImage', '', { shouldDirty: true });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register('email')} />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <Input {...form.register('phone')} />
          </Field>
          <Field label="Website" error={form.formState.errors.website?.message} className="md:col-span-2">
            <Input type="url" placeholder="https://example.com" {...form.register('website')} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="City" error={form.formState.errors.city?.message}>
            <Input {...form.register('city')} />
          </Field>
          <Field label="State / region" error={form.formState.errors.state?.message}>
            <Input {...form.register('state')} />
          </Field>
          <Field label="Country (ISO-2)" error={form.formState.errors.country?.message}>
            <Input maxLength={2} {...form.register('country')} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>
          Save profile
        </Button>
      </div>
    </form>
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
    <div className={className}>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
