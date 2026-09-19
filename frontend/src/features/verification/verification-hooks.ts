'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient, extractError } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

// ----------------------------------------------------------------------------
// Shared types
// ----------------------------------------------------------------------------

export type VerificationTarget = 'business' | 'professional';

export type VerificationLevel = 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';

export type VerificationStatusKey =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'DOCUMENTS_UPLOADED'
  | 'AUTO_CHECKING'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export type DocumentType =
  | 'TRADE_LICENSE'
  | 'NATIONAL_ID'
  | 'TAX_CERTIFICATE'
  | 'BUSINESS_REGISTRATION'
  | 'ADDRESS_PROOF'
  | 'PROFESSIONAL_LICENSE'
  | 'OTHER';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  TRADE_LICENSE: 'Trade License',
  NATIONAL_ID: 'National ID / Passport',
  TAX_CERTIFICATE: 'Tax Certificate',
  BUSINESS_REGISTRATION: 'Business Registration',
  ADDRESS_PROOF: 'Proof of Address',
  PROFESSIONAL_LICENSE: 'Professional License',
  OTHER: 'Other Supporting Document',
};

export const DOCUMENT_TYPES: DocumentType[] = [
  'TRADE_LICENSE',
  'NATIONAL_ID',
  'TAX_CERTIFICATE',
  'BUSINESS_REGISTRATION',
  'ADDRESS_PROOF',
  'PROFESSIONAL_LICENSE',
  'OTHER',
];

/**
 * Map a target to the path segment used in backend URLs.
 *   business    → /businesses/:id/verification/...
 *   professional → /professionals/:id/verification/...
 */
export function targetPath(target: VerificationTarget): 'businesses' | 'professionals' {
  return target === 'business' ? 'businesses' : 'professionals';
}

/**
 * Build a verification endpoint URL given a target + relative path. Always
 * include a leading slash on `path`.
 */
export function verificationEndpoint(
  target: VerificationTarget,
  id: string,
  path: string,
): string {
  const prefix = targetPath(target);
  const tail = path.startsWith('/') ? path : `/${path}`;
  return `/${prefix}/${id}/verification${tail === '/' ? '' : tail}`;
}

// ----------------------------------------------------------------------------
// Hook input shapes
// ----------------------------------------------------------------------------

export interface EligibilityCheck {
  actual: number | string;
  required: number | string;
  passed: boolean;
  plan?: string;
}

export interface EligibilityResponse {
  eligible: boolean;
  checks: {
    reviewCount: EligibilityCheck;
    avgRating: EligibilityCheck;
    plan: EligibilityCheck;
  };
  alreadyVerified: boolean;
}

export interface VerificationStatusResponse {
  status: VerificationStatusKey;
  application?: {
    id: string;
    status: VerificationStatusKey;
    appliedAt?: string;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    level?: VerificationLevel;
    estimatedReviewAt?: string | null;
    type?: 'BASIC' | 'PREMIUM';
    additionalNotes?: string | null;
    rejectionReason?: string | null;
    reviewerId?: string | null;
  } | null;
}

export interface StatusHistoryEntry {
  id: string;
  status: VerificationStatusKey;
  note?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface AiAnalysisFlag {
  severity: 'low' | 'medium' | 'high';
  message: string;
  documentId?: string;
}

export interface AiAnalysis {
  extractedFields: Record<string, unknown>;
  flags: AiAnalysisFlag[];
  confidenceScore: number;
  suggestedDecision: 'APPROVE' | 'REJECT';
  summary?: string | null;
  modelUsed: string;
  processedAt?: string;
}

export interface VerificationDocument {
  id: string;
  applicationId: string;
  type: DocumentType;
  status: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
  uploadedAt: string;
  rejectionReason?: string | null;
  extractedFields?: Record<string, unknown> | null;
}

export interface VerificationApplication {
  id: string;
  businessId: string | null;
  professionalId: string | null;
  level: VerificationLevel;
  type: 'BASIC' | 'PREMIUM';
  status: VerificationStatusKey;
  appliedAt: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  estimatedReviewAt?: string | null;
  additionalNotes?: string | null;
  rejectionReason?: string | null;
  reviewerId?: string | null;
  aiScore?: number | null;
  documents: (Pick<VerificationDocument, 'id' | 'type' | 'status'> & {
    mimeType?: string;
    fileSize?: number;
    fileUrl?: string;
    originalName?: string;
    uploadedAt?: string;
  })[];
  statusHistory: StatusHistoryEntry[];
  aiAnalysis: AiAnalysis | null;
  business?: {
    id: string;
    displayName: string;
    slug?: string;
    logo?: string | null;
  };
  professional?: {
    id: string;
    displayName: string;
    slug?: string;
  };
}

export interface BadgeInfo {
  hasBadge: boolean;
  badgeType: VerificationLevel | null;
  issuedAt: string | null;
  expiresAt: string | null;
  badgeImageUrl: string | null;
  verificationUrl: string | null;
  badgeId?: string;
}

// ----------------------------------------------------------------------------
// Query key helper for non-business targets. We extend the shared helper so
// every key is namespaced under `verification.*`.
// ----------------------------------------------------------------------------

function proKey(name: string, ...args: unknown[]) {
  return ['verification', 'pro', name, ...args] as const;
}

// ----------------------------------------------------------------------------
// Eligibility
// ----------------------------------------------------------------------------

export function useEligibility(
  target: VerificationTarget,
  entityId: string | null | undefined,
) {
  const fn = target === 'business' ? qk.verification.eligibility : (id: string) => proKey('eligibility', id);
  return useQuery({
    queryKey: entityId ? fn(entityId) : ['verification', 'eligibility', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: EligibilityResponse }>(
        verificationEndpoint(target, entityId as string, '/eligibility'),
      );
      return res.data.data;
    },
    enabled: Boolean(entityId),
  });
}

// ----------------------------------------------------------------------------
// Status / current application
// ----------------------------------------------------------------------------

export function useVerificationStatus(
  target: VerificationTarget,
  entityId: string | null | undefined,
) {
  const fn = target === 'business' ? qk.verification.status : (id: string) => proKey('status', id);
  return useQuery({
    queryKey: entityId ? fn(entityId) : ['verification', 'status', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: VerificationStatusResponse;
      }>(verificationEndpoint(target, entityId as string, ''));
      return res.data.data;
    },
    enabled: Boolean(entityId),
  });
}

export function useVerificationApplication(
  target: VerificationTarget,
  entityId: string | null | undefined,
  applicationId: string | null | undefined,
  options?: Omit<UseQueryOptions<VerificationApplication>, 'queryKey' | 'queryFn'>,
) {
  const fn =
    target === 'business'
      ? qk.verification.application
      : (id: string, appId: string) => proKey('application', id, appId);
  return useQuery({
    queryKey:
      entityId && applicationId
        ? fn(entityId, applicationId)
        : ['verification', 'application', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: VerificationApplication }>(
        verificationEndpoint(target, entityId as string, `/applications/${applicationId}`),
      );
      return res.data.data;
    },
    enabled: Boolean(entityId && applicationId),
    ...options,
  });
}

export function useVerificationDocuments(
  target: VerificationTarget,
  entityId: string | null | undefined,
  applicationId: string | null | undefined,
) {
  const fn =
    target === 'business'
      ? qk.verification.documents
      : (id: string, appId: string) => proKey('documents', id, appId);
  return useQuery({
    queryKey:
      entityId && applicationId
        ? fn(entityId, applicationId)
        : ['verification', 'documents', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: VerificationDocument[];
      }>(
        verificationEndpoint(
          target,
          entityId as string,
          `/applications/${applicationId}/documents`,
        ),
      );
      return res.data.data;
    },
    enabled: Boolean(entityId && applicationId),
  });
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

interface ApplyInput {
  level: VerificationLevel;
  type: 'BASIC' | 'PREMIUM';
}

export function useApply(target: VerificationTarget, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplyInput) => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        verificationEndpoint(target, entityId, '/apply'),
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      // Refresh both the verification status and the profile so the
      // dashboard banner / sidebar reflects the new application. Keys differ
      // by target so we invalidate both namespaces — the unused one is a
      // cheap no-op.
      qc.invalidateQueries({ queryKey: ['verification', 'status', entityId] });
      qc.invalidateQueries({ queryKey: proKey('status', entityId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      qc.invalidateQueries({ queryKey: qk.professionals.me() });
    },
  });
}

interface UploadInput {
  type: DocumentType;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
}

export function useUploadDocument(
  target: VerificationTarget,
  entityId: string,
  applicationId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const res = await apiClient.post<{ success: true; data: VerificationDocument }>(
        verificationEndpoint(
          target,
          entityId,
          `/applications/${applicationId}/documents`,
        ),
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      // Documents and application caches differ per target (business uses
      // `qk.verification.*`, professional uses `proKey('…')`). Invalidate
      // both prefixes so the upload is reflected whichever target was used.
      qc.invalidateQueries({
        queryKey: ['verification', 'documents', entityId, applicationId],
      });
      qc.invalidateQueries({
        queryKey: proKey('documents', entityId, applicationId),
      });
      qc.invalidateQueries({
        queryKey: ['verification', 'application', entityId, applicationId],
      });
      qc.invalidateQueries({
        queryKey: proKey('application', entityId, applicationId),
      });
    },
  });
}

export function useDeleteDocument(
  target: VerificationTarget,
  entityId: string,
  applicationId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(
        verificationEndpoint(
          target,
          entityId,
          `/applications/${applicationId}/documents/${documentId}`,
        ),
      );
      return documentId;
    },
    onSuccess: () => {
      // See note in `useUploadDocument` — invalidate both namespaces.
      qc.invalidateQueries({
        queryKey: ['verification', 'documents', entityId, applicationId],
      });
      qc.invalidateQueries({
        queryKey: proKey('documents', entityId, applicationId),
      });
    },
  });
}

interface SubmitInput {
  additionalNotes?: string;
}

export function useSubmitApplication(
  target: VerificationTarget,
  entityId: string,
  applicationId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitInput = {}) => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        verificationEndpoint(target, entityId, `/applications/${applicationId}/submit`),
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      // Refresh the specific application, the status query, and the
      // business/profile so the dashboard banner updates.
      qc.invalidateQueries({
        queryKey: ['verification', 'application', entityId, applicationId],
      });
      qc.invalidateQueries({
        queryKey: proKey('application', entityId, applicationId),
      });
      qc.invalidateQueries({ queryKey: ['verification', 'status', entityId] });
      qc.invalidateQueries({ queryKey: proKey('status', entityId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      qc.invalidateQueries({ queryKey: qk.professionals.me() });
    },
  });
}

export function useCancelApplication(
  target: VerificationTarget,
  entityId: string,
  applicationId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        verificationEndpoint(target, entityId, `/applications/${applicationId}/cancel`),
        {},
      );
      return res.data.data;
    },
    onSuccess: () => {
      // See note in `useSubmitApplication`.
      qc.invalidateQueries({
        queryKey: ['verification', 'application', entityId, applicationId],
      });
      qc.invalidateQueries({
        queryKey: proKey('application', entityId, applicationId),
      });
      qc.invalidateQueries({ queryKey: ['verification', 'status', entityId] });
      qc.invalidateQueries({ queryKey: proKey('status', entityId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      qc.invalidateQueries({ queryKey: qk.professionals.me() });
    },
  });
}

export function useAppealApplication(
  target: VerificationTarget,
  entityId: string,
  applicationId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        verificationEndpoint(target, entityId, `/applications/${applicationId}/appeal`),
        { reason },
      );
      return res.data.data;
    },
    onSuccess: () => {
      // See note in `useSubmitApplication`.
      qc.invalidateQueries({
        queryKey: ['verification', 'application', entityId, applicationId],
      });
      qc.invalidateQueries({
        queryKey: proKey('application', entityId, applicationId),
      });
      qc.invalidateQueries({ queryKey: ['verification', 'status', entityId] });
      qc.invalidateQueries({ queryKey: proKey('status', entityId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
      qc.invalidateQueries({ queryKey: qk.professionals.me() });
    },
  });
}

export function useBadge(
  target: VerificationTarget,
  entityId: string | null | undefined,
) {
  const fn = target === 'business' ? qk.verification.badge : (id: string) => proKey('badge', id);
  return useQuery({
    queryKey: entityId ? fn(entityId) : ['verification', 'badge', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: BadgeInfo }>(
        verificationEndpoint(target, entityId as string, '/badge'),
      );
      return res.data.data;
    },
    enabled: Boolean(entityId),
  });
}

export function useBadgeEmbed(
  target: VerificationTarget,
  entityId: string | null | undefined,
) {
  return useQuery({
    queryKey:
      entityId
        ? target === 'business'
          ? qk.verification.embed(entityId)
          : proKey('embed', entityId)
        : ['verification', 'embed', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: { html: string; javascript: string; css: string; badgeId: string; apiUrl: string };
      }>(verificationEndpoint(target, entityId as string, '/badge/embed'));
      return res.data.data;
    },
    enabled: Boolean(entityId),
  });
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

export function isTerminal(status: VerificationStatusKey): boolean {
  return status === 'APPROVED' || status === 'REJECTED';
}

export function isInReview(status: VerificationStatusKey): boolean {
  return (
    status === 'AUTO_CHECKING' ||
    status === 'HUMAN_REVIEW_REQUIRED' ||
    status === 'PENDING' ||
    status === 'DOCUMENTS_UPLOADED'
  );
}

export { extractError };
