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
  BUSINESS_DAYS,
  BUSINESS_DAY_LABELS,
  businessProfileUpdateSchema,
  createBusinessSchema,
  type BusinessProfileUpdateInput,
  type CreateBusinessInput,
} from '@credible/shared';
import { ImageUpload } from '@/components/ui/image-upload';
import { Building2 } from 'lucide-react';

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

type ProfileFormValues = BusinessProfileUpdateInput;

export function ProfileForm() {
  const qc = useQueryClient();

  const { data: profile, isLoading, error: profileError } = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ProfileResponse }>(
        '/businesses/me/profile',
      );
      return res.data.data;
    },
    retry: false,
  });

  const noBusiness =
    profileError &&
    ((profileError as { response?: { status?: number } })?.response?.status === 404);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (noBusiness) {
    return <CreateBusinessForm />;
  }

  if (profileError && !noBusiness) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          {extractError(profileError).message}
        </CardContent>
      </Card>
    );
  }

  return <EditBusinessProfile />;
}

// ----------------------------------------------------------------------------
// Create Business Form
// ----------------------------------------------------------------------------

type CreateFormValues = CreateBusinessInput;

function CreateBusinessForm() {
  const qc = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: qk.categories.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: CategoryOption[] }>('/categories');
      return res.data.data;
    },
  });

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      legalName: '',
      displayName: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'BD',
    },
  });

  const create = useMutation({
    mutationFn: async (values: CreateFormValues) => {
      const res = await apiClient.post<{ success: true; data: { id: string } }>(
        '/businesses',
        values,
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Business created! Now set up your profile.');
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const onSubmit: SubmitHandler<CreateFormValues> = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== ''),
    ) as CreateFormValues;
    create.mutate(cleaned);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Create your business profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Get started by entering your business details. You can add photos and more info after.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Legal name *" error={form.formState.errors.legalName?.message}>
            <Input {...form.register('legalName')} placeholder="Official business name" />
          </Field>
          <Field label="Display name *" error={form.formState.errors.displayName?.message}>
            <Input {...form.register('displayName')} placeholder="Name shown to customers" />
          </Field>
          <Field label="Description" error={form.formState.errors.description?.message}>
            <Textarea rows={3} {...form.register('description')} placeholder="Brief description of your business" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} placeholder="contact@business.com" />
            </Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input {...form.register('phone')} placeholder="+880 1XXXXXXXXX" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City" error={form.formState.errors.city?.message}>
              <Input {...form.register('city')} />
            </Field>
            <Field label="Country (ISO-2)" error={form.formState.errors.country?.message}>
              <Input maxLength={2} {...form.register('country')} />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={create.isPending}>
              Create business
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Edit Business Profile
// ----------------------------------------------------------------------------

function EditBusinessProfile() {
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ProfileResponse }>(
        '/businesses/me/profile',
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(businessProfileUpdateSchema),
    defaultValues: {
      legalName: '',
      displayName: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'BD',
      yearEstablished: undefined,
      employeeCount: '',
      logo: '',
      coverImage: '',
      metaTitle: '',
      metaDescription: '',
      categoryIds: [],
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        legalName: profile.legalName ?? '',
        displayName: profile.displayName ?? '',
        description: profile.description ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        website: profile.website ?? '',
        addressLine1: profile.addressLine1 ?? '',
        addressLine2: profile.addressLine2 ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        postalCode: profile.postalCode ?? '',
        country: profile.country ?? 'BD',
        yearEstablished: profile.yearEstablished ?? undefined,
        employeeCount: profile.employeeCount ?? '',
        logo: profile.logo ?? '',
        coverImage: profile.coverImage ?? '',
        metaTitle: profile.metaTitle ?? '',
        metaDescription: profile.metaDescription ?? '',
        hoursJson: (profile.hoursJson as ProfileFormValues['hoursJson']) ?? {},
        categoryIds: profile.categories?.map((c) => c.id) ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const save = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiClient.patch<{ success: true; data: unknown }>(
        '/businesses/me/profile',
        values,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      qc.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = (values) => {
    const cleaned: ProfileFormValues = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== ''),
    ) as ProfileFormValues;
    save.mutate(cleaned);
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <BasicInfoSection form={form} />
      <ImagesSection form={form} />
      <ContactSection form={form} />
      <AddressSection form={form} />
      <HoursSection form={form} />
      <CategoriesSection form={form} categories={categories ?? []} />
      <SeoSection form={form} />

      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------------
// Sub-sections
// ----------------------------------------------------------------------------

interface SectionProps {
  form: ReturnType<typeof useForm<ProfileFormValues>>;
}

function BasicInfoSection({ form }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic info</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Legal name" error={form.formState.errors.legalName?.message}>
          <Input {...form.register('legalName')} />
        </Field>
        <Field label="Display name" error={form.formState.errors.displayName?.message}>
          <Input {...form.register('displayName')} />
        </Field>
        <Field label="Description" error={form.formState.errors.description?.message} className="md:col-span-2">
          <Textarea rows={4} {...form.register('description')} />
        </Field>
        <Field label="Year established" error={form.formState.errors.yearEstablished?.message}>
          <Input
            type="number"
            {...form.register('yearEstablished', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Employee count" error={form.formState.errors.employeeCount?.message}>
          <Input {...form.register('employeeCount')} />
        </Field>
      </CardContent>
    </Card>
  );
}

function ImagesSection({ form }: SectionProps) {
  const logo = form.watch('logo');
  const coverImage = form.watch('coverImage');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload a logo and cover image so customers can easily recognise your business.
        </p>
        <div className="flex flex-wrap gap-6">
          <ImageUpload
            value={logo}
            onChange={(url) => form.setValue('logo', url ?? '', { shouldDirty: true })}
            namespace="public"
            label="Logo"
            aspect="logo"
          />
          <ImageUpload
            value={coverImage}
            onChange={(url) => form.setValue('coverImage', url ?? '', { shouldDirty: true })}
            namespace="public"
            label="Cover image"
            aspect="cover"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ContactSection({ form }: SectionProps) {
  return (
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
  );
}

function AddressSection({ form }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Address</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Address line 1" error={form.formState.errors.addressLine1?.message} className="md:col-span-2">
          <Input {...form.register('addressLine1')} />
        </Field>
        <Field label="Address line 2" error={form.formState.errors.addressLine2?.message} className="md:col-span-2">
          <Input {...form.register('addressLine2')} />
        </Field>
        <Field label="City" error={form.formState.errors.city?.message}>
          <Input {...form.register('city')} />
        </Field>
        <Field label="State / region" error={form.formState.errors.state?.message}>
          <Input {...form.register('state')} />
        </Field>
        <Field label="Postal code" error={form.formState.errors.postalCode?.message}>
          <Input {...form.register('postalCode')} />
        </Field>
        <Field label="Country (ISO-2)" error={form.formState.errors.country?.message}>
          <Input maxLength={2} {...form.register('country')} />
        </Field>
      </CardContent>
    </Card>
  );
}

function HoursSection({ form }: SectionProps) {
  const hours = (form.watch('hoursJson') ?? {}) as Record<
    string,
    { closed?: boolean; open?: string; close?: string }
  >;

  const setEntry = (day: string, patch: Partial<{ closed: boolean; open: string; close: string }>) => {
    const current = hours[day] ?? { closed: false };
    (form.setValue as (name: string, value: unknown, opts?: { shouldDirty?: boolean }) => void)(
      `hoursJson.${day}`,
      { ...current, ...patch },
      { shouldDirty: true },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operating hours</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {BUSINESS_DAYS.map((day) => {
          const entry = hours[day] ?? { closed: false };
          return (
            <div key={day} className="grid grid-cols-[6rem_6rem_1fr_1fr] items-center gap-3">
              <span className="text-sm font-medium">{BUSINESS_DAY_LABELS[day]}</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(entry.closed)}
                  onChange={(e) => setEntry(day, { closed: e.target.checked })}
                />
                Closed
              </label>
              <Input
                type="time"
                disabled={entry.closed}
                value={entry.open ?? ''}
                onChange={(e) => setEntry(day, { open: e.target.value })}
                aria-label={`${BUSINESS_DAY_LABELS[day]} opening time`}
              />
              <Input
                type="time"
                disabled={entry.closed}
                value={entry.close ?? ''}
                onChange={(e) => setEntry(day, { close: e.target.value })}
                aria-label={`${BUSINESS_DAY_LABELS[day]} closing time`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface CategoriesSectionProps extends SectionProps {
  categories: CategoryOption[];
}

function CategoriesSection({ form, categories }: CategoriesSectionProps) {
  const selected = form.watch('categoryIds') ?? [];
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      form.setValue('categoryIds', selected.filter((c) => c !== id), { shouldDirty: true });
    } else if (selected.length < 8) {
      form.setValue('categoryIds', [...selected, id], { shouldDirty: true });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories are available yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = selected.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Up to 8 categories. Pick the ones that best describe what your business offers.
        </p>
      </CardContent>
    </Card>
  );
}

function SeoSection({ form }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Meta title" error={form.formState.errors.metaTitle?.message} className="md:col-span-2">
          <Input {...form.register('metaTitle')} />
        </Field>
        <Field
          label="Meta description"
          error={form.formState.errors.metaDescription?.message}
          className="md:col-span-2"
        >
          <Textarea rows={3} {...form.register('metaDescription')} />
        </Field>
      </CardContent>
    </Card>
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

// Backend response shape — kept local to the form for now.
interface ProfileResponse {
  id: string;
  legalName: string;
  displayName: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  yearEstablished?: number | null;
  employeeCount?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  hoursJson?: Record<string, { closed?: boolean; open?: string; close?: string }> | null;
  categories?: { id: string; slug: string; name: string }[];
}
