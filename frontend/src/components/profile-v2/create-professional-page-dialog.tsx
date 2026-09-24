'use client';

/**
 * CreateProfessionalPageDialog — walks the owner through creating a
 * professional page from inside their own profile. Shell (sidebar +
 * footer) lives in `./page-create-dialog-shell`; this file owns the
 * type-specific steps.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Stethoscope, User2 } from 'lucide-react';
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
  createProfessionalSchema,
  type CreateProfessionalInput,
} from '@credible/shared';

import type { SwitchMode } from './page-mode';
import {
  PageCreateDialogShell,
  REQUIRED_DOCS,
  ReviewItem,
} from './page-create-dialog-shell';

interface CreateProfessionalPageDialogProps {
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

export function CreateProfessionalPageDialog({
  open,
  onOpenChange,
  mode,
  username,
  prefill,
}: CreateProfessionalPageDialogProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const withDocs = mode === 'with-docs';
  const lastStep = (withDocs ? 4 : 3) as Step;
  const isReviewStep = (s: Step) => s === lastStep;

  const [step, setStep] = useState<Step>(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocUpload[]>([]);

  const form = useForm<CreateProfessionalInput>({
    resolver: zodResolver(createProfessionalSchema),
    defaultValues: {
      title: '',
      displayName:
        buildFullName(prefill?.firstName, prefill?.lastName) || '',
      headline: '',
      bio: '',
      profession: '',
      email: prefill?.email ?? '',
      phone: '',
      website: '',
      city: '',
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
    mutationFn: async (values: CreateProfessionalInput) => {
      const payload: CreateProfessionalInput = {
        ...values,
        avatar: avatarUrl ?? '',
        coverImage: coverUrl ?? '',
      };
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
      }>('/professionals', payload);
      const created = res.data.data;

      // Role upgrade CUSTOMER → PROFESSIONAL — refresh JWT so the
      // subsequent publish call (gated on requireRole('PROFESSIONAL'))
      // does not 403.
      await refreshSessionTokens();

      // publish + verification application creation are independent —
      // run them in parallel and let failures bubble into debugWarn.
      const tasks: Array<Promise<unknown>> = [
        apiClient
          .post<{ success: true; data: unknown }>(
            `/professionals/${created.professional.id}/publish`,
          )
          .catch((publishErr: unknown) => {
            debugWarn('[create-professional-dialog] auto-publish failed:', publishErr);
          }),
      ];
      if (withDocs && docs.length > 0) {
        tasks.push(
          (async () => {
            try {
              const appRes = await apiClient.post<{
                success: true;
                data: { id: string };
              }>(
                `/professionals/${created.professional.id}/verification/applications`,
                { level: 'CERTIFIED', type: 'CERTIFIED' },
              );
              const appId = appRes.data.data.id;
              await Promise.allSettled(
                docs.map((doc) =>
                  apiClient
                    .post(
                      `/professionals/${created.professional.id}/verification/applications/${appId}/documents`,
                      { type: doc.type, fileUrl: doc.url, filename: doc.filename },
                    )
                    .catch((docErr: unknown) => {
                      debugWarn('[create-professional-dialog] doc upload failed:', docErr);
                    }),
                ),
              );
            } catch (appErr) {
              debugWarn(
                '[create-professional-dialog] verification app create failed:',
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
          ? 'Professional page created with documents submitted!'
          : 'Professional page created!',
      );
      qc.invalidateQueries({ queryKey: qk.professionals.all() });
      qc.invalidateQueries({ queryKey: qk.users.byUsername(username) });
      qc.invalidateQueries({ queryKey: qk.users.me() });
      if (user) refreshSessionUser(user);
      onOpenChange(false);
      router.push('/professional/profile');
    },
    onError: (err) => {
      toast.error(friendlyMessage(err, 'profile'));
    },
  });

  const goNext = async () => {
    let ok = true;
    if (step === 1) {
      ok = await form.trigger(['displayName', 'profession']);
    }
    if (ok) setStep((s) => (s < lastStep ? ((s + 1) as Step) : s));
  };

  const onBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const onSubmit: SubmitHandler<CreateProfessionalInput> = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    ) as CreateProfessionalInput;
    create.mutate(cleaned);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <PageCreateDialogShell<Step>
        open={open}
        isPending={create.isPending}
        onOpenChange={onOpenChange}
        title="Create professional page"
        sections={sections}
        step={step}
        lastStep={lastStep}
        withDocs={withDocs}
        onStepClick={setStep}
        onBack={onBack}
        onContinue={goNext}
        submitLabel="Create professional page"
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
                  <Stethoscope className="h-3.5 w-3.5" />
                  Identity
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Tell us about you
                </h2>
                <p className="text-xs text-muted-foreground">
                  This is what prospective clients will see on your public page.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Display name"
                    required
                    error={form.formState.errors.displayName?.message}
                  >
                    <Input
                      {...form.register('displayName')}
                      placeholder="e.g. Dr. Jane Doe"
                    />
                  </Field>
                  <Field
                    label="Profession"
                    required
                    error={form.formState.errors.profession?.message}
                  >
                    <Input
                      {...form.register('profession')}
                      placeholder="e.g. Cardiologist"
                    />
                  </Field>
                </div>
                <Field
                  label="Title (optional)"
                  error={form.formState.errors.title?.message}
                >
                  <Input {...form.register('title')} placeholder="Dr., Adv., Md." />
                </Field>
                <Field
                  label="Headline"
                  error={form.formState.errors.headline?.message}
                >
                  <Input
                    {...form.register('headline')}
                    placeholder="One-sentence summary shown under your name"
                    maxLength={140}
                  />
                </Field>
                <Field label="Bio" error={form.formState.errors.bio?.message}>
                  <Textarea
                    rows={3}
                    {...form.register('bio')}
                    placeholder="Background, services, approach — anything that builds trust."
                  />
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
                  <User2 className="h-3.5 w-3.5" />
                  Photos
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Add a profile photo and cover
                </h2>
                <p className="text-xs text-muted-foreground">
                  Both are optional — you can upload later from your dashboard.
                </p>
                <div className="flex flex-wrap gap-6">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    namespace="public"
                    label="Profile photo"
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
                  Upload your verification documents
                </h2>
                <p className="text-xs text-muted-foreground">
                  Submitting documents now starts your verification review in parallel. You can
                  also skip and add them later from your dashboard.
                </p>
                <VerificationDocumentList
                  target="professional"
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
                  <ReviewItem label="Display name" value={form.watch('displayName') || '—'} />
                  <ReviewItem label="Profession" value={form.watch('profession') || '—'} />
                  {form.watch('headline') ? (
                    <ReviewItem label="Headline" value={form.watch('headline') as string} />
                  ) : null}
                  <ReviewItem label="Profile photo" value={avatarUrl ? 'Uploaded' : 'Skipped'} />
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