'use client';

/**
 * CreateBusinessPageDialog — walks the owner through creating a business
 * page from inside their own profile. Shell (sidebar + footer) lives in
 * `./page-create-dialog-shell`; this file owns the type-specific steps.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Camera, CheckCircle2 } from 'lucide-react';
import { fullName as buildFullName } from '@credible/shared';
import { toast } from 'sonner';

import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  VerificationDocumentList,
  type DocUpload,
} from '@/components/ui/verification-document-list';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { debugWarn } from '@/lib/utils';
import { qk } from '@/lib/api/query-keys';
import { refreshSessionUser, refreshSessionTokens } from '@/lib/auth/refresh-session-user';
import {
  createBusinessSchema,
  type CreateBusinessInput,
} from '@credible/shared';

import type { SwitchMode } from './page-mode';
import {
  PageCreateDialogShell,
  REQUIRED_DOCS,
  ReviewItem,
} from './page-create-dialog-shell';

interface CreateBusinessPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SwitchMode;
  username: string;
  prefill?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

type Step = 1 | 2 | 3 | 4;

export function CreateBusinessPageDialog({
  open,
  onOpenChange,
  mode,
  username,
  prefill,
}: CreateBusinessPageDialogProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const withDocs = mode === 'with-docs';
  const lastStep = (withDocs ? 4 : 3) as Step;
  const isReviewStep = (s: Step) => s === lastStep;

  const [step, setStep] = useState<Step>(1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocUpload[]>([]);

  const form = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      legalName:
        buildFullName(prefill?.firstName, prefill?.lastName) || '',
      displayName: '',
      description: '',
      email: prefill?.email ?? '',
      phone: '',
      website: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'BD',
    },
  });

  const sections = useMemo(
    () =>
      withDocs
        ? [
            { id: 1, label: 'Identity' },
            { id: 2, label: 'Photos' },
            { id: 3, label: 'Documents' },
            { id: 4, label: 'Review' },
          ]
        : [
            { id: 1, label: 'Identity' },
            { id: 2, label: 'Photos' },
            { id: 3, label: 'Review' },
          ],
    [withDocs],
  );

  const create = useMutation({
    mutationFn: async (values: CreateBusinessInput) => {
      const res = await apiClient.post<{
        success: true;
        data: {
          business: { id: string };
          user: {
            id: string;
            email: string;
            role: string;
            firstName?: string;
            lastName?: string;
            avatar?: string;
          };
        };
      }>('/businesses', values);
      const created = res.data.data;

      await refreshSessionTokens();

      // publish, photo PATCH and (optional) verification application
      // creation are all independent — fan them out in parallel and
      // let failures bubble into debugWarn.
      const tasks: Array<Promise<unknown>> = [
        apiClient
          .post<{ success: true; data: unknown }>(
            `/businesses/${created.business.id}/publish`,
          )
          .catch((publishErr: unknown) => {
            debugWarn('[create-business-dialog] auto-publish failed:', publishErr);
          }),
      ];
      if (logoUrl || coverUrl) {
        tasks.push(
          apiClient
            .patch(`/businesses/${created.business.id}/profile`, {
              ...(logoUrl ? { logo: logoUrl } : {}),
              ...(coverUrl ? { coverImage: coverUrl } : {}),
            })
            .catch((photoErr: unknown) => {
              debugWarn('[create-business-dialog] photo PATCH failed:', photoErr);
            }),
        );
      }
      if (withDocs && docs.length > 0) {
        tasks.push(
          (async () => {
            try {
              const appRes = await apiClient.post<{
                success: true;
                data: { id: string };
              }>(
                `/businesses/${created.business.id}/verification/applications`,
                { level: 'CERTIFIED', type: 'CERTIFIED' },
              );
              const appId = appRes.data.data.id;
              await Promise.allSettled(
                docs.map((doc) =>
                  apiClient
                    .post(
                      `/businesses/${created.business.id}/verification/applications/${appId}/documents`,
                      { type: doc.type, fileUrl: doc.url, filename: doc.filename },
                    )
                    .catch((docErr: unknown) => {
                      debugWarn('[create-business-dialog] doc upload failed:', docErr);
                    }),
                ),
              );
            } catch (appErr) {
              debugWarn(
                '[create-business-dialog] verification app create failed:',
                appErr,
              );
            }
          })(),
        );
      }
      await Promise.allSettled(tasks);

      return created;
    },
    onSuccess: ({ user }) => {
      toast.success(
        withDocs
          ? 'Business page created with documents submitted!'
          : 'Business page created!',
      );
      qc.invalidateQueries({ queryKey: qk.businesses.all() });
      qc.invalidateQueries({ queryKey: qk.users.byUsername(username) });
      qc.invalidateQueries({ queryKey: qk.users.me() });
      if (user) refreshSessionUser(user);
      onOpenChange(false);
      router.push('/business/profile');
    },
    onError: (err) => {
      toast.error(friendlyMessage(err, 'profile'));
    },
  });

  const goNext = async () => {
    let ok = true;
    if (step === 1) {
      ok = await form.trigger(['legalName', 'displayName', 'country']);
    }
    if (ok) setStep((s) => (s < lastStep ? ((s + 1) as Step) : s));
  };

  const onBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const onSubmit: SubmitHandler<CreateBusinessInput> = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    ) as CreateBusinessInput;
    create.mutate(cleaned);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <PageCreateDialogShell<Step>
        open={open}
        isPending={create.isPending}
        onOpenChange={onOpenChange}
        title="Create business page"
        sections={sections}
        step={step}
        lastStep={lastStep}
        withDocs={withDocs}
        onStepClick={setStep}
        onBack={onBack}
        onContinue={goNext}
        submitLabel="Create business page"
        body={
          <>
            {step === 1 && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Building2 className="h-3.5 w-3.5" />
                  Identity
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  About your business
                </h2>
                <p className="text-xs text-muted-foreground">
                  The legal identity of the entity and what customers should see.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Legal name"
                    required
                    error={form.formState.errors.legalName?.message}
                  >
                    <Input
                      {...form.register('legalName')}
                      placeholder="Acme Holdings Ltd."
                    />
                  </Field>
                  <Field
                    label="Display name"
                    required
                    error={form.formState.errors.displayName?.message}
                  >
                    <Input
                      {...form.register('displayName')}
                      placeholder="How customers know you"
                    />
                  </Field>
                </div>
                <Field
                  label="Description"
                  error={form.formState.errors.description?.message}
                >
                  <Textarea
                    rows={3}
                    {...form.register('description')}
                    placeholder="One or two sentences about what your business does."
                  />
                </Field>
                <Field
                  label="Country (ISO-2)"
                  required
                  error={form.formState.errors.country?.message}
                  className="max-w-[160px]"
                >
                  <Input maxLength={2} {...form.register('country')} placeholder="BD" />
                </Field>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Camera className="h-3.5 w-3.5" />
                  Photos
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Add a logo and cover photo
                </h2>
                <p className="text-xs text-muted-foreground">
                  Both are optional — customers recognise businesses faster with photos.
                </p>
                <div className="flex flex-wrap gap-6">
                  <ImageUpload
                    value={logoUrl}
                    onChange={setLogoUrl}
                    namespace="public"
                    label="Logo"
                    aspect="logo"
                  />
                  <ImageUpload
                    value={coverUrl}
                    onChange={setCoverUrl}
                    namespace="public"
                    label="Cover photo"
                    aspect="cover"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && withDocs && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Upload your business verification documents
                </h2>
                <p className="text-xs text-muted-foreground">
                  Submitting documents now starts your verification review in parallel. You can
                  also skip and add them later from your dashboard.
                </p>
                <VerificationDocumentList
                  target="business"
                  docs={docs}
                  onChange={setDocs}
                />
              </motion.div>
            )}

            {isReviewStep(step) && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Review
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Review & create
                </h2>
                <ul className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
                  <ReviewItem label="Legal name" value={form.watch('legalName') || '—'} />
                  <ReviewItem label="Display name" value={form.watch('displayName') || '—'} />
                  <ReviewItem label="Country" value={form.watch('country') || '—'} />
                  <ReviewItem label="Logo" value={logoUrl ? 'Uploaded' : 'Skipped'} />
                  <ReviewItem label="Cover photo" value={coverUrl ? 'Uploaded' : 'Skipped'} />
                  {withDocs && (
                    <ReviewItem
                      label="Documents"
                      value={
                        docs.length > 0
                          ? `${docs.length} of ${REQUIRED_DOCS} uploaded`
                          : 'None uploaded (can add later)'
                      }
                    />
                  )}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Your page will be auto-published so it is visible right away. You can edit everything
                  from your dashboard afterwards.
                </p>
              </motion.div>
            )}
          </>
        }
      />
    </form>
  );
}
