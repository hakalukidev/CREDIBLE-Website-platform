'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractError } from '@/lib/api/client';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type ReviewStatusKey =
  | 'PUBLISHED'
  | 'FLAGGED'
  | 'HIDDEN'
  | 'DELETED'
  | 'PENDING_MODERATION';

export type ReviewTargetTypeKey = 'BUSINESS' | 'PROFESSIONAL';

export interface AdminReview {
  id: string;
  businessId: string | null;
  professionalId: string | null;
  targetType: ReviewTargetTypeKey;
  rating: number;
  title: string | null;
  content: string;
  status: ReviewStatusKey;
  reportCount: number;
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  business?: { id: string; slug: string; displayName: string } | null;
  professional?: { id: string; slug: string; displayName: string } | null;
  flags: Array<{
    id: string;
    reason: string;
    notes: string | null;
    flaggedById: string;
    flaggedBy: { id: string; email: string; firstName: string | null; lastName: string | null };
    resolvedAt: string | null;
    resolvedById: string | null;
    createdAt: string;
  }>;
  adminResponse: string | null;
  adminRespondedAt: string | null;
  adminRespondedBy: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

interface Paginated<T> {
  items: T[];
  total: number;
}

// ----------------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------------

export function useAdminReviews(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'reviews', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{ success: true; data: Paginated<AdminReview> }>(
        `/admin/reviews?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

export function useAdminReview(reviewId: string | null | undefined) {
  return useQuery({
    queryKey: reviewId ? ['admin', 'review', reviewId] : ['admin', 'review', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminReview }>(
        `/admin/reviews/${reviewId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(reviewId),
  });
}

export function useAdminRespondReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; message: string }) => {
      const { id, message } = input;
      const res = await apiClient.post<{ success: true; data: AdminReview }>(
        `/admin/reviews/${id}/respond`,
        { message },
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Response posted');
      qc.invalidateQueries({ queryKey: ['admin', 'review', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

export function useResolveReviewFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reviewId: string; flagId: string; note?: string }) => {
      const { reviewId, flagId, note } = input;
      const res = await apiClient.post<{ success: true; data: AdminReview }>(
        `/admin/reviews/${reviewId}/flags/${flagId}/resolve`,
        note ? { note } : {},
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Flag resolved');
      qc.invalidateQueries({ queryKey: ['admin', 'review', vars.reviewId] });
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

export function useForceReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: 'PUBLISHED' | 'HIDDEN' | 'PENDING_MODERATION';
      reason: string;
    }) => {
      const { id, ...rest } = input;
      const res = await apiClient.post<{ success: true; data: AdminReview }>(
        `/admin/reviews/${id}/status`,
        rest,
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['admin', 'review', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}