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
// Shared types — keep narrow shapes that match the backend responses.
// ----------------------------------------------------------------------------

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
}

export interface VerificationApplication {
  id: string;
  businessId: string;
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
// Eligibility
// ----------------------------------------------------------------------------

export function useEligibility(businessId: string | null | undefined) {
  return useQuery({
    queryKey: businessId ? qk.verification.eligibility(businessId) : ['verification', 'eligibility', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: EligibilityResponse }>(
        `/businesses/${businessId}/verification/eligibility`,
      );
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });
}

// ----------------------------------------------------------------------------
// Status / current application
// ----------------------------------------------------------------------------

export function useVerificationStatus(businessId: string | null | undefined) {
  return useQuery({
    queryKey: businessId ? qk.verification.status(businessId) : ['verification', 'status', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: VerificationStatusResponse;
      }>(`/businesses/${businessId}/verification`);
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });
}

export function useVerificationApplication(
  businessId: string | null | undefined,
  applicationId: string | null | undefined,
  options?: Omit<UseQueryOptions<VerificationApplication>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey:
      businessId && applicationId
        ? qk.verification.application(businessId, applicationId)
        : ['verification', 'application', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: VerificationApplication }>(
        `/businesses/${businessId}/verification/applications/${applicationId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(businessId && applicationId),
    ...options,
  });
}

export function useVerificationDocuments(
  businessId: string | null | undefined,
  applicationId: string | null | undefined,
) {
  return useQuery({
    queryKey:
      businessId && applicationId
        ? qk.verification.documents(businessId, applicationId)
        : ['verification', 'documents', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: VerificationDocument[];
      }>(
        `/businesses/${businessId}/verification/applications/${applicationId}/documents`,
      );
      return res.data.data;
    },
    enabled: Boolean(businessId && applicationId),
  });
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

interface ApplyInput {
  level: VerificationLevel;
  type: 'BASIC' | 'PREMIUM';
}

export function useApply(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplyInput) => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        `/businesses/${businessId}/verification/apply`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification.status(businessId) });
      qc.invalidateQueries({ queryKey: qk.verification.applications(businessId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
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

export function useUploadDocument(businessId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const res = await apiClient.post<{ success: true; data: VerificationDocument }>(
        `/businesses/${businessId}/verification/applications/${applicationId}/documents`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification.documents(businessId, applicationId) });
      qc.invalidateQueries({ queryKey: qk.verification.application(businessId, applicationId) });
    },
  });
}

export function useDeleteDocument(businessId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(
        `/businesses/${businessId}/verification/applications/${applicationId}/documents/${documentId}`,
      );
      return documentId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification.documents(businessId, applicationId) });
    },
  });
}

interface SubmitInput {
  additionalNotes?: string;
}

export function useSubmitApplication(businessId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitInput = {}) => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        `/businesses/${businessId}/verification/applications/${applicationId}/submit`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification.application(businessId, applicationId) });
      qc.invalidateQueries({ queryKey: qk.verification.status(businessId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
    },
  });
}

export function useCancelApplication(businessId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        `/businesses/${businessId}/verification/applications/${applicationId}/cancel`,
        {},
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification.application(businessId, applicationId) });
      qc.invalidateQueries({ queryKey: qk.verification.status(businessId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
    },
  });
}

export function useAppealApplication(businessId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiClient.post<{ success: true; data: VerificationApplication }>(
        `/businesses/${businessId}/verification/applications/${applicationId}/appeal`,
        { reason },
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.verification.application(businessId, applicationId) });
      qc.invalidateQueries({ queryKey: qk.verification.status(businessId) });
      qc.invalidateQueries({ queryKey: qk.businesses.me() });
    },
  });
}

export function useBadge(businessId: string | null | undefined) {
  return useQuery({
    queryKey: businessId ? qk.verification.badge(businessId) : ['verification', 'badge', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: BadgeInfo }>(
        `/businesses/${businessId}/verification/badge`,
      );
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });
}

export function useBadgeEmbed(businessId: string | null | undefined) {
  return useQuery({
    queryKey: businessId ? qk.verification.embed(businessId) : ['verification', 'embed', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: { html: string; javascript: string; css: string; badgeId: string; apiUrl: string };
      }>(`/businesses/${businessId}/verification/badge/embed`);
      return res.data.data;
    },
    enabled: Boolean(businessId),
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
