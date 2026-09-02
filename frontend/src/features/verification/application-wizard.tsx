'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, FileUp, Trash2, Upload, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import {
  DOCUMENT_TYPES,
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
} from './verification-hooks';

interface Props {
  businessId: string;
  applicationId?: string;
  onCreated?: (app: VerificationApplication) => void;
}

type Step = 'choose-level' | 'upload' | 'review' | 'submitting';

interface ChooseLevelValues {
  level: VerificationLevel;
  type: 'BASIC' | 'PREMIUM';
}

interface SubmitValues {
  additionalNotes?: string;
}

export function ApplicationWizard({
  businessId,
  applicationId,
  onCreated,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(applicationId ? 'upload' : 'choose-level');
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(
    applicationId ?? null,
  );

  const { data: application, isLoading: appLoading } = useVerificationApplication(
    businessId,
    activeApplicationId,
  );

  useEffect(() => {
    if (application && !activeApplicationId) {
      setActiveApplicationId(application.id);
    }
  }, [application, activeApplicationId]);

  if (appLoading && activeApplicationId) {
    return <Skeleton className="h-64" />;
  }

  // No application yet — render the "choose level" step.
  if (!activeApplicationId) {
    return (
      <ChooseLevelStep
        businessId={businessId}
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
      step={step}
      setStep={setStep}
      application={application!}
      businessId={businessId}
      applicationId={activeApplicationId}
      onCancel={() => router.push('/business/dashboard')}
    />
  );
}

// ----------------------------------------------------------------------------
// Step 1 — choose level
// ----------------------------------------------------------------------------

function ChooseLevelStep({
  businessId,
  onApplied,
}: {
  businessId: string;
  onApplied: (app: VerificationApplication) => void;
}) {
  const apply = useApply(businessId);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>1 · Choose a verification level</CardTitle>
        <CardDescription>
          All three tiers include AI-assisted review. CERTIFIED and PREMIUM add an
          on-site visit and faster review SLAs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
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
                  {form.watch('level') === level && <Check className="h-4 w-4 text-primary" />}
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
  step,
  setStep,
  application,
  businessId,
  applicationId,
  onCancel,
}: {
  step: Step;
  setStep: (s: Step) => void;
  application: VerificationApplication;
  businessId: string;
  applicationId: string;
  onCancel: () => void;
}) {
  if (step === 'upload') {
    return (
      <UploadStep
        application={application}
        businessId={businessId}
        applicationId={applicationId}
        onNext={() => setStep('review')}
        onCancel={onCancel}
      />
    );
  }
  if (step === 'review') {
    return (
      <ReviewStep
        application={application}
        businessId={businessId}
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
        application={application}
        businessId={businessId}
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
  application,
  businessId,
  applicationId,
  onNext,
  onCancel,
}: {
  application: VerificationApplication;
  businessId: string;
  applicationId: string;
  onNext: () => void;
  onCancel: () => void;
}) {
  const { data: documents, isLoading } = useVerificationDocuments(businessId, applicationId);
  const uploadMutation = useUploadDocument(businessId, applicationId);
  const deleteMutation = useDeleteDocument(businessId, applicationId);
  const [progress, setProgress] = useState<number | null>(null);

  const docs = documents ?? application.documents.map((d) => ({
    id: d.id,
    type: d.type as DocumentType,
    status: d.status,
    fileKey: '',
    fileUrl: '',
    mimeType: '',
    fileSize: 0,
    originalName: '',
    uploadedAt: '',
    applicationId,
  } as unknown as VerificationDocument));

  const requiredTypes = useMemo(() => {
    // 3 unique document types is the minimum for any useful submission.
    const types = new Set(docs.map((d) => d.type));
    DOCUMENT_TYPES.forEach((t) => types.add(t));
    return Array.from(types);
  }, [docs]);

  const canProceed = docs.length >= 3;

  async function handleFileChange(file: File, type: DocumentType) {
    try {
      setProgress(5);
      const presign = await apiClient.post<{
        success: true;
        data: { url: string; key: string; publicUrl: string };
      }>('/uploads/presign', {
        namespace: 'documents',
        contentType: file.type,
        originalName: file.name,
        size: file.size,
      });
      setProgress(40);
      // PUT the file to the presigned URL.
      await fetch(presign.data.data.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      setProgress(70);
      await uploadMutation.mutateAsync({
        type,
        fileKey: presign.data.data.key,
        fileUrl: presign.data.data.publicUrl,
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
          Upload at least 3 documents (PDF, JPG, or PNG; max 20MB each). We use them to
          verify your business registration, identity, and address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {DOCUMENT_TYPE_LABELS[d.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.mimeType} · {Math.round((d.fileSize ?? 0) / 1024)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => deleteMutation.mutate(d.id)}
                aria-label="Remove document"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <UploadRow requiredTypes={requiredTypes} onFile={handleFileChange} />

        {progress !== null && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {docs.length}/3 documents ·{' '}
            <span className={canProceed ? 'text-green-600' : 'text-destructive'}>
              {canProceed ? 'ready to continue' : 'at least 3 required'}
            </span>
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

function UploadRow({
  requiredTypes,
  onFile,
}: {
  requiredTypes: DocumentType[];
  onFile: (file: File, type: DocumentType) => void;
}) {
  const [type, setType] = useState<DocumentType>(requiredTypes[0] ?? 'TRADE_LICENSE');
  // re-sync if list changes
  useEffect(
    () => setType((curr) => curr ?? requiredTypes[0] ?? 'TRADE_LICENSE'),
    [requiredTypes],
  );
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as DocumentType)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        aria-label="Document type"
      >
        {DOCUMENT_TYPES.filter((t) => requiredTypes.includes(t)).map((t) => (
          <option key={t} value={t}>
            {DOCUMENT_TYPE_LABELS[t]}
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
    </div>
  );
}

// ----------------------------------------------------------------------------
// Review / submit step
// ----------------------------------------------------------------------------

function ReviewStep({
  application,
  businessId,
  applicationId,
  onBack,
  onSubmit,
}: {
  application: VerificationApplication;
  businessId: string;
  applicationId: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const submit = useSubmitApplication(businessId, applicationId);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>3 · Review &amp; submit</CardTitle>
        <CardDescription>
          Once submitted, our team will review your application within 3 business days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryRow label="Level" value={application.level} />
        <SummaryRow label="Type" value={application.type} />
        <SummaryRow label="Documents" value={`${application.documents.length} file(s)`} />

        <form onSubmit={onConfirmed} className="space-y-4">
          <div>
            <Label htmlFor="additionalNotes">Additional notes for the reviewer (optional)</Label>
            <Textarea id="additionalNotes" rows={4} {...form.register('additionalNotes')} />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button type="submit" loading={submit.isPending}>
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
  application,
  businessId,
  applicationId,
  onCancel,
}: {
  application: VerificationApplication;
  businessId: string;
  applicationId: string;
  onCancel: () => void;
}) {
  const cancel = useCancelApplication(businessId, applicationId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="success">Submitted</Badge>
          <CardTitle>Your application is being reviewed</CardTitle>
        </div>
        <CardDescription>
          We'll email you the moment we have an update. You can also track progress below.
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
        <StatusTimeline businessId={businessId} applicationId={applicationId} />
      </CardContent>
    </Card>
  );
}

import { StatusTimeline } from './status-timeline';
