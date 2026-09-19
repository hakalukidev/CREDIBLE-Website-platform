'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  FileUp,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { uploadToStorage } from '@/lib/upload';
import {
  DOCUMENT_TYPE_LABELS,
  useApply,
  useCancelApplication,
  useDeleteDocument,
  useSubmitApplication,
  useUploadDocument,
  useVerificationApplication,
  useVerificationDocuments,
  type DocumentType,
  type VerificationApplication,
  type VerificationDocument,
  type VerificationLevel,
  type VerificationTarget,
} from './verification-hooks';
import {
  REQUIRED_DOCUMENTS_BY_TARGET,
  getMissingRequiredDocs,
  labelFor,
} from './document-requirements';
import { StatusTimeline } from './status-timeline';

interface Props {
  /** Which profile type this wizard belongs to. */
  target: VerificationTarget;
  /** Entity id (businessId or professionalId). */
  entityId: string;
  /** Optional: an already-created application id to resume. */
  applicationId?: string;
  /** Optional callback fired when a fresh application is created. */
  onCreated?: (app: VerificationApplication) => void;
  /** Optional: override the cancel/redirect destination. */
  cancelHref?: string;
}

type Step = 'choose-level' | 'upload' | 'review' | 'submitting';

interface ChooseLevelValues {
  level: VerificationLevel;
  type: 'BASIC' | 'PREMIUM';
}

interface SubmitValues {
  additionalNotes?: string;
}

const DEFAULT_CANCEL: Record<VerificationTarget, string> = {
  business: '/business/dashboard',
  professional: '/professional/dashboard',
};

export function ApplicationWizard({
  target,
  entityId,
  applicationId,
  onCreated,
  cancelHref,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(applicationId ? 'upload' : 'choose-level');
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(
    applicationId ?? null,
  );

  const { data: application, isLoading: appLoading } = useVerificationApplication(
    target,
    entityId,
    activeApplicationId,
  );

  useEffect(() => {
    if (application && !activeApplicationId) {
      setActiveApplicationId(application.id);
    }
  }, [application, activeApplicationId]);

  const handleCancel = () => router.push((cancelHref ?? DEFAULT_CANCEL[target]) as Route);

  if (appLoading && activeApplicationId) {
    return <Skeleton className="h-64" />;
  }

  // No application yet — render the "choose level" step.
  if (!activeApplicationId) {
    return (
      <ChooseLevelStep
        target={target}
        entityId={entityId}
        onApplied={(app) => {
          setActiveApplicationId(app.id);
          setStep('upload');
          onCreated?.(app);
        }}
      />
    );
  }

  return (
    <WizardSteps
      target={target}
      step={step}
      setStep={setStep}
      application={application!}
      entityId={entityId}
      applicationId={activeApplicationId}
      onCancel={handleCancel}
    />
  );
}

// ----------------------------------------------------------------------------
// Step 1 — choose level
// ----------------------------------------------------------------------------

function ChooseLevelStep({
  target,
  entityId,
  onApplied,
}: {
  target: VerificationTarget;
  entityId: string;
  onApplied: (app: VerificationApplication) => void;
}) {
  const apply = useApply(target, entityId);
  const form = useForm<ChooseLevelValues>({
    defaultValues: { level: 'BASIC', type: 'BASIC' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const app = await apply.mutateAsync(values);
      toast.success('Application created');
      onApplied(app);
    } catch (err) {
      toast.error(friendlyMessage(err, 'verification'));
    }
  });

  const requiredDocs = REQUIRED_DOCUMENTS_BY_TARGET[target];

  return (
    <Card>
      <CardHeader>
        <CardTitle>1 · Choose a verification level</CardTitle>
        <CardDescription>
          All three tiers include AI-assisted review. CERTIFIED and PREMIUM add a
          business call or on-site visit and faster review SLAs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <fieldset className="grid gap-3 md:grid-cols-3">
            {(['BASIC', 'CERTIFIED', 'PREMIUM'] as const).map((level) => (
              <label
                key={level}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  form.watch('level') === level
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={level}
                  {...form.register('level')}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{level}</span>
                  {form.watch('level') === level && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {LEVEL_DESCRIPTIONS[level]}
                </p>
              </label>
            ))}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="type">Application type</Label>
            <select
              id="type"
              {...form.register('type')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="BASIC">BASIC — digital review</option>
              <option value="PREMIUM">PREMIUM — includes site visit</option>
            </select>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What you&apos;ll need to upload
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {requiredDocs.map((docType) => (
                <li key={docType} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{labelFor(docType)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={apply.isPending}>
              Start application <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const LEVEL_DESCRIPTIONS: Record<VerificationLevel, string> = {
  NONE: '',
  BASIC: 'Digital review of submitted documents. 3 business day SLA.',
  CERTIFIED: 'Digital review + business call. 2 business day SLA.',
  PREMIUM: 'On-site visit, background check, and unlimited badge embed uses.',
};

// ----------------------------------------------------------------------------
// Step 2/3/4 — upload / review / submitting
// ----------------------------------------------------------------------------

function WizardSteps({
  target,
  step,
  setStep,
  application,
  entityId,
  applicationId,
  onCancel,
}: {
  target: VerificationTarget;
  step: Step;
  setStep: (s: Step) => void;
  application: VerificationApplication;
  entityId: string;
  applicationId: string;
  onCancel: () => void;
}) {
  if (step === 'upload') {
    return (
      <UploadStep
        target={target}
        application={application}
        entityId={entityId}
        applicationId={applicationId}
        onNext={() => setStep('review')}
        onCancel={onCancel}
      />
    );
  }
  if (step === 'review') {
    return (
      <ReviewStep
        target={target}
        application={application}
        entityId={entityId}
        applicationId={applicationId}
        onBack={() => setStep('upload')}
        onSubmit={() => {
          setStep('submitting');
        }}
      />
    );
  }
  if (step === 'submitting') {
    return (
      <SubmittedStep
        target={target}
        entityId={entityId}
        applicationId={applicationId}
        onCancel={onCancel}
      />
    );
  }
  return null;
}

// ----------------------------------------------------------------------------
// Upload step
// ----------------------------------------------------------------------------

function UploadStep({
  target,
  application,
  entityId,
  applicationId,
  onNext,
  onCancel,
}: {
  target: VerificationTarget;
  application: VerificationApplication;
  entityId: string;
  applicationId: string;
  onNext: () => void;
  onCancel: () => void;
}) {
  const { data: documents, isLoading } = useVerificationDocuments(
    target,
    entityId,
    applicationId,
  );
  const uploadMutation = useUploadDocument(target, entityId, applicationId);
  const deleteMutation = useDeleteDocument(target, entityId, applicationId);
  const [progress, setProgress] = useState<number | null>(null);

  const requiredDocs = REQUIRED_DOCUMENTS_BY_TARGET[target];

  // Prefer fresh data from the documents endpoint, but fall back to whatever
  // the parent application payload already has so the list never goes empty
  // mid-refetch.
  const docs = useMemo<VerificationDocument[]>(() => {
    if (documents && documents.length > 0) return documents;
    return application.documents.map((d) => ({
      id: d.id,
      applicationId,
      type: d.type,
      status: d.status,
      fileKey: '',
      fileUrl: d.fileUrl ?? '',
      mimeType: d.mimeType ?? '',
      fileSize: d.fileSize ?? 0,
      originalName: d.originalName ?? '',
      uploadedAt: d.uploadedAt ?? '',
    }));
  }, [documents, application, applicationId]);

  const uploadedTypes = docs.map((d) => d.type);
  const missingRequired = getMissingRequiredDocs(uploadedTypes, target);
  const canProceed = missingRequired.length === 0;

  // Build the set of allowed doc types for the picker: required first
  // (whether uploaded or not), then anything already uploaded.
  const availableTypes: DocumentType[] = useMemo(() => {
    const set = new Set<DocumentType>(requiredDocs);
    uploadedTypes.forEach((t) => set.add(t));
    return Array.from(set);
  }, [requiredDocs, uploadedTypes]);

  async function handleFileChange(file: File, type: DocumentType) {
    try {
      setProgress(5);
      const { key: fileKey, publicUrl } = await uploadToStorage(file, 'documents');
      setProgress(70);
      await uploadMutation.mutateAsync({
        type,
        fileKey,
        fileUrl: publicUrl,
        mimeType: file.type,
        fileSize: file.size,
        originalName: file.name,
      });
      setProgress(100);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(friendlyMessage(err, 'verification'));
    } finally {
      setTimeout(() => setProgress(null), 1500);
    }
  }

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>2 · Upload supporting documents</CardTitle>
        <CardDescription>
          Upload the documents listed below. Each one is reviewed by our AI extractor
          and then by a human reviewer. PDF, JPG, or PNG · max 20 MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RequiredChecklist
          required={requiredDocs}
          uploadedTypes={uploadedTypes}
        />

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Uploaded documents
          </p>
          {docs.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              No documents uploaded yet. Use the picker below to add your first
              required document.
            </p>
          ) : (
            <div className="grid gap-2">
              {docs.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  onDelete={() => deleteMutation.mutate(d.id)}
                  deleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        <UploadRow
          availableTypes={availableTypes}
          uploadedTypes={uploadedTypes}
          onFile={handleFileChange}
        />

        {progress !== null && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Uploading… {progress}%
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {docs.length} document{docs.length === 1 ? '' : 's'} uploaded ·{' '}
            {canProceed ? (
              <span className="font-medium text-green-600">
                All required documents present
              </span>
            ) : (
              <span className="font-medium text-amber-700">
                {missingRequired.length} required document
                {missingRequired.length === 1 ? '' : 's'} remaining
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" disabled={!canProceed} onClick={onNext}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RequiredChecklist({
  required,
  uploadedTypes,
}: {
  required: readonly DocumentType[];
  uploadedTypes: DocumentType[];
}) {
  const uploadedSet = new Set(uploadedTypes);
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Required documents
      </p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {required.map((docType) => {
          const done = uploadedSet.has(docType);
          return (
            <li key={docType} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <CircleAlert className="h-4 w-4 text-amber-600" />
              )}
              <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                {labelFor(docType)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DocumentRow({
  doc,
  onDelete,
  deleting,
}: {
  doc: VerificationDocument;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm">
      <div className="flex items-center gap-3">
        <FileUp className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{labelFor(doc.type)}</p>
          <p className="text-xs text-muted-foreground">
            {doc.originalName || doc.fileUrl || '—'}
            {doc.mimeType
              ? ` · ${doc.mimeType}${doc.fileSize ? ` · ${Math.round(doc.fileSize / 1024)} KB` : ''}`
              : ''}
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Remove document"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function UploadRow({
  availableTypes,
  uploadedTypes,
  onFile,
}: {
  availableTypes: DocumentType[];
  uploadedTypes: DocumentType[];
  onFile: (file: File, type: DocumentType) => void;
}) {
  // Prefer the next missing required type as the default selection, otherwise
  // the first available type.
  const requiredDocs = availableTypes.filter((t) => {
    // We can't know which are required from this prop alone, so fall back to
    // any not-yet-uploaded type.
    return !uploadedTypes.includes(t);
  });
  const defaultType =
    requiredDocs[0] ?? availableTypes[0] ?? ('OTHER' as DocumentType);
  const [type, setType] = useState<DocumentType>(defaultType);

  useEffect(() => {
    setType(defaultType);
    // We intentionally only re-sync when the available list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTypes.join(',')]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as DocumentType)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        aria-label="Document type"
      >
        {availableTypes.map((t) => (
          <option key={t} value={t}>
            {DOCUMENT_TYPE_LABELS[t] ?? t}
          </option>
        ))}
      </select>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
        <Upload className="h-4 w-4" />
        <span>Choose file</span>
        <input
          type="file"
          className="sr-only"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file, type);
            e.target.value = '';
          }}
        />
      </label>
      <p className="basis-full text-xs text-muted-foreground">
        PDF, JPG, or PNG · max 20 MB
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Review / submit step
// ----------------------------------------------------------------------------

function ReviewStep({
  target,
  application,
  entityId,
  applicationId,
  onBack,
  onSubmit,
}: {
  target: VerificationTarget;
  application: VerificationApplication;
  entityId: string;
  applicationId: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const submit = useSubmitApplication(target, entityId, applicationId);
  const form = useForm<SubmitValues>({
    defaultValues: { additionalNotes: application.additionalNotes ?? '' },
  });

  const onConfirmed = form.handleSubmit(async (values) => {
    try {
      await submit.mutateAsync(values);
      toast.success('Application submitted — review started');
      onSubmit();
    } catch (err) {
      toast.error(friendlyMessage(err, 'verification'));
    }
  });

  const requiredDocs = REQUIRED_DOCUMENTS_BY_TARGET[target];
  const uploadedTypes = new Set(application.documents.map((d) => d.type));
  const missingRequired = requiredDocs.filter((t) => !uploadedTypes.has(t));

  return (
    <Card>
      <CardHeader>
        <CardTitle>3 · Review &amp; submit</CardTitle>
        <CardDescription>
          Once submitted, our team will review your application. You&apos;ll receive an
          email the moment we have an update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryRow label="Level" value={application.level} />
        <SummaryRow label="Type" value={application.type} />
        <SummaryRow
          label="Documents"
          value={`${application.documents.length} file(s)`}
        />
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Required documents submitted
          </p>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {requiredDocs.map((docType) => {
              const done = uploadedTypes.has(docType);
              return (
                <li key={docType} className="flex items-center gap-2">
                  {done ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <CircleAlert className="h-4 w-4 text-amber-600" />
                  )}
                  <span className={done ? '' : 'text-muted-foreground'}>
                    {labelFor(docType)}
                  </span>
                </li>
              );
            })}
          </ul>
          {missingRequired.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Some required documents are missing — go back and upload them before
              submitting.
            </p>
          )}
        </div>

        <form onSubmit={onConfirmed} className="space-y-4">
          <div>
            <Label htmlFor="additionalNotes">
              Additional notes for the reviewer (optional)
            </Label>
            <Textarea
              id="additionalNotes"
              rows={4}
              {...form.register('additionalNotes')}
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              type="submit"
              loading={submit.isPending}
              disabled={missingRequired.length > 0}
            >
              Submit for review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Submitted step
// ----------------------------------------------------------------------------

function SubmittedStep({
  target,
  entityId,
  applicationId,
  onCancel,
}: {
  target: VerificationTarget;
  entityId: string;
  applicationId: string;
  onCancel: () => void;
}) {
  const cancel = useCancelApplication(target, entityId, applicationId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="success">Submitted</Badge>
          <CardTitle>Your application is being reviewed</CardTitle>
        </div>
        <CardDescription>
          We&apos;ll email you the moment we have an update. You can also track progress
          below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              cancel.mutate(undefined, {
                onSuccess: () => {
                  toast.success('Application cancelled');
                  onCancel();
                },
              })
            }
          >
            <X className="h-4 w-4" /> Cancel application
          </Button>
        </div>
        <StatusTimeline
          target={target}
          entityId={entityId}
          applicationId={applicationId}
        />
      </CardContent>
    </Card>
  );
}
