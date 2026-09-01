'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractError } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type {
  AiAnalysis,
  VerificationApplication,
  VerificationDocument,
  VerificationLevel,
  VerificationStatusKey,
} from '@/features/verification/verification-hooks';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  approvedToday: number;
  rejectionRate: number;
  averageReviewHours: number;
}

export interface AdminApplication {
  id: string;
  businessId: string;
  status: VerificationStatusKey;
  appliedAt: string;
  level: VerificationLevel;
  type: 'BASIC' | 'PREMIUM';
  business: { id: string; displayName: string; slug: string; ownerId: string };
  documents: Pick<VerificationDocument, 'id' | 'type' | 'status'>[];
}

export interface AdminListResponse {
  items: AdminApplication[];
  total: number;
}

// ----------------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------------

export function useAdminStats() {
  return useQuery({
    queryKey: qk.verification.adminStats(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminStats }>(
        '/admin/verification/stats',
      );
      return res.data.data;
    },
  });
}

export function useAdminApplications(filters: {
  status?: VerificationStatusKey;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  return useQuery({
    queryKey: qk.verification.adminList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.perPage) params.set('perPage', String(filters.perPage));
      const res = await apiClient.get<{ success: true; data: AdminListResponse }>(
        `/admin/verification/applications?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

export function useAdminApplication(applicationId: string | null | undefined) {
  return useQuery({
    queryKey:
      applicationId ? qk.verification.adminApplication(applicationId) : ['admin', 'app', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: VerificationApplication;
      }>(`/admin/verification/applications/${applicationId}`);
      return res.data.data;
    },
    enabled: Boolean(applicationId),
  });
}

export function useAdminAiAnalysis(applicationId: string | null | undefined) {
  return useQuery({
    queryKey: applicationId ? [...qk.verification.adminApplication(applicationId), 'ai'] : ['admin', 'ai', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: AiAnalysis | null;
      }>(`/admin/verification/applications/${applicationId}/ai-analysis`);
      return res.data.data;
    },
    enabled: Boolean(applicationId),
  });
}

interface DecideInput {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
  badgeType?: VerificationLevel;
  notes?: string;
}

export function useDecideApplication(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DecideInput) => {
      const res = await apiClient.post<{
        success: true;
        data: VerificationApplication;
      }>(`/admin/verification/applications/${applicationId}/decide`, input);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Decision recorded');
      qc.invalidateQueries({ queryKey: qk.verification.adminApplication(applicationId) });
      qc.invalidateQueries({ queryKey: ['verification', 'admin', 'list'] });
      qc.invalidateQueries({ queryKey: qk.verification.adminStats() });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });
}

interface RevokeInput {
  businessId: string;
  reason: string;
}

export function useRevokeBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RevokeInput) => {
      const res = await apiClient.post<{ success: true; data: { revoked: boolean } }>(
        `/admin/verification/businesses/${input.businessId}/revoke`,
        { reason: input.reason },
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Badge revoked');
      qc.invalidateQueries({ queryKey: ['verification', 'admin'] });
      qc.invalidateQueries({ queryKey: ['verification'] });
      qc.invalidateQueries({ queryKey: ['businesses', 'me'] });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });
}