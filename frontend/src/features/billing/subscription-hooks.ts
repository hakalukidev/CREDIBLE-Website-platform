'use client';

/**
 * Owner-facing billing hooks. Built on TanStack Query, mirrors the API surface
 * exposed by `apps/api/src/modules/subscriptions/subscriptions.controller.ts`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type {
  AdminBillingStats,
  AdminPaymentRow,
  BillingCycle,
  CurrentSubscription,
  Invoice,
  PaymentGateway,
  PaymentRecord,
  PlanInfo,
  SubscribeResult,
  SubscriptionPlan,
  VoucherValidation,
} from './types';

/** Wire envelope used by every API response. */
type Envelope<T> = { success: true; data: T };
type ListEnvelope<T> = Envelope<T> & { meta?: { page: number; perPage: number; total: number; totalPages: number } };

// ---- Subscription ----

export function useCurrentSubscription() {
  return useQuery({
    queryKey: qk.billing.current(),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<CurrentSubscription>>(
        '/business/subscription',
      );
      return res.data.data;
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: qk.billing.plans(),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<PlanInfo[]>>(
        '/business/subscription/plans',
      );
      return res.data.data;
    },
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      planId: SubscriptionPlan;
      billingCycle: BillingCycle;
      gateway: PaymentGateway;
      voucherCode?: string;
    }) => {
      const res = await apiClient.post<Envelope<SubscribeResult>>(
        '/business/subscription/subscribe',
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.billing.current() });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { immediate: boolean; reason?: string }) => {
      const res = await apiClient.post<Envelope<CurrentSubscription>>(
        '/business/subscription/cancel',
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.billing.current() });
    },
  });
}

export function useReactivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<Envelope<CurrentSubscription>>(
        '/business/subscription/reactivate',
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.billing.current() });
    },
  });
}

// ---- Invoices ----

export function useInvoices(page = 1, perPage = 20) {
  return useQuery({
    queryKey: qk.billing.invoices(page, perPage),
    queryFn: async () => {
      const res = await apiClient.get<ListEnvelope<Invoice[]>>(
        `/business/subscription/invoices?page=${page}&perPage=${perPage}`,
      );
      return res.data;
    },
  });
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    enabled: Boolean(invoiceId),
    queryKey: invoiceId ? qk.billing.invoice(invoiceId) : ['billing', 'invoice', 'noop'],
    queryFn: async () => {
      const res = await apiClient.get<Envelope<Invoice>>(
        `/business/subscription/invoices/${invoiceId}`,
      );
      return res.data.data;
    },
  });
}

export function invoiceDownloadUrl(invoiceId: string): string {
  // Direct browser navigation — backend streams the PDF.
  return `${process.env.NEXT_PUBLIC_API_URL ?? ''}/business/subscription/invoices/${invoiceId}/download`;
}

// ---- Payments ----

export function usePaymentHistory(page = 1, perPage = 20) {
  return useQuery({
    queryKey: qk.billing.payments(page, perPage),
    queryFn: async () => {
      const res = await apiClient.get<ListEnvelope<PaymentRecord[]>>(
        `/business/subscription/payment-history?page=${page}&perPage=${perPage}`,
      );
      return res.data;
    },
  });
}

// ---- Voucher ----

export function useValidateVoucher() {
  return useMutation({
    mutationFn: async (input: {
      code: string;
      planId: SubscriptionPlan;
      amount: number;
    }) => {
      const res = await apiClient.post<Envelope<VoucherValidation>>(
        '/business/subscription/voucher/validate',
        input,
      );
      return res.data.data;
    },
  });
}

// ---- Admin ----

export function useAdminBillingStats() {
  return useQuery({
    queryKey: qk.billing.adminStats(),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<AdminBillingStats>>(
        '/admin/billing/payments/stats',
      );
      return res.data.data;
    },
  });
}

export function useAdminPayments(filters: {
  page: number;
  perPage: number;
  status?: string;
  gateway?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('perPage', String(filters.perPage));
  if (filters.status) params.set('status', filters.status);
  if (filters.gateway) params.set('gateway', filters.gateway);
  if (filters.search) params.set('search', filters.search);
  return useQuery({
    queryKey: qk.billing.adminPayments(filters),
    queryFn: async () => {
      const res = await apiClient.get<ListEnvelope<AdminPaymentRow[]>>(
        `/admin/billing/payments?${params.toString()}`,
      );
      return res.data;
    },
  });
}

export function useAdminSubscriptions(filters: {
  page: number;
  perPage: number;
  status?: string;
  plan?: SubscriptionPlan;
  search?: string;
}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('perPage', String(filters.perPage));
  if (filters.status) params.set('status', filters.status);
  if (filters.plan) params.set('plan', filters.plan);
  if (filters.search) params.set('search', filters.search);
  return useQuery({
    queryKey: qk.billing.adminSubscriptions(filters),
    queryFn: async () => {
      const res = await apiClient.get<ListEnvelope<unknown[]>>(
        `/admin/billing/subscriptions?${params.toString()}`,
      );
      return res.data;
    },
  });
}

export function useAdminVouchers(filters: {
  page: number;
  perPage: number;
  active?: boolean;
  search?: string;
}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('perPage', String(filters.perPage));
  if (typeof filters.active === 'boolean') params.set('active', String(filters.active));
  if (filters.search) params.set('search', filters.search);
  return useQuery({
    queryKey: qk.billing.adminVouchers(filters),
    queryFn: async () => {
      const res = await apiClient.get<ListEnvelope<unknown[]>>(
        `/admin/billing/vouchers?${params.toString()}`,
      );
      return res.data;
    },
  });
}