'use client';

/**
 * Admin hooks for managing marketing pricing plans. Wraps the
 * `/admin/billing/plans` endpoints and keeps both the admin table
 * and the public `/plans` cache in sync after every mutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type { PlanAudience } from '@credible/shared';

export interface AdminPlan {
  id: string;
  code: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  description: string | null;
  priceMonthly: string; // Prisma Decimal → string
  priceYearly: string;
  currency: string;
  highlights: string[];
  ctaLabel: string | null;
  audience: PlanAudience;
  hasBadge: boolean;
  hasVerification: boolean;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export type AdminUpsertPlanPayload = Partial<
  Pick<
    AdminPlan,
    | 'name'
    | 'description'
    | 'currency'
    | 'audience'
    | 'highlights'
    | 'ctaLabel'
    | 'hasBadge'
    | 'hasVerification'
    | 'isActive'
    | 'priority'
  >
> & {
  code: AdminPlan['code'];
  /** Numbers (Decimal-friendly) — serialized to JSON as numbers. */
  priceYearly?: number;
  priceMonthly?: number;
};

type Envelope<T> = { success: true; data: T };

export function useAdminPlans() {
  return useQuery({
    queryKey: qk.billing.adminPlans(),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<AdminPlan[]>>('/admin/billing/plans');
      return res.data.data;
    },
  });
}

export function useAdminUpsertPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminUpsertPlanPayload) => {
      const res = await apiClient.put<Envelope<AdminPlan>>(
        `/admin/billing/plans/${input.code}`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.billing.adminPlans() });
      qc.invalidateQueries({ queryKey: qk.billing.plans() });
    },
  });
}

export function useAdminDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: AdminPlan['code']) => {
      const res = await apiClient.delete<Envelope<{ code: string }>>(
        `/admin/billing/plans/${code}`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.billing.adminPlans() });
      qc.invalidateQueries({ queryKey: qk.billing.plans() });
    },
  });
}
