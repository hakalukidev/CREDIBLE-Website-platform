'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractError } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type AdminRole = 'CUSTOMER' | 'BUSINESS' | 'PROFESSIONAL' | 'ADMIN';
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: AdminRole;
  status: AdminUserStatus;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AdminBusinessSummary {
  id: string;
  slug: string;
  displayName: string;
  legalName: string;
  status: string;
  verificationStatus: string;
  city: string | null;
  owner: { id: string; email: string; firstName: string | null; lastName: string | null };
}

export interface AdminProfessionalSummary {
  id: string;
  slug: string;
  displayName: string;
  profession: string | null;
  status: string;
  verificationStatus: string;
  city: string | null;
  owner: { id: string; email: string; firstName: string | null; lastName: string | null };
}

export interface AdminPaymentSummary {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  paidAt: string | null;
  createdAt: string;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
  business?: { id: string; displayName: string; slug: string } | null;
  professional?: { id: string; displayName: string; slug: string } | null;
}

export interface AdminSubscriptionSummary {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
  business?: { id: string; displayName: string; slug: string } | null;
}

export interface AdminContactRequestSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
  notes: string | null;
  business?: { id: string; displayName: string; slug: string } | null;
}

export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  action: string;
  target: string | null;
  meta: unknown;
  createdAt: string;
}

export interface AdminSetting {
  id: string;
  key: string;
  valueJson: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

interface Paginated<T> {
  items: T[];
  total: number;
}

// ----------------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------------

export function useAdminUsers(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{ success: true; data: Paginated<AdminUserSummary> }>(
        `/admin/users?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

export function useAdminUser(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? ['admin', 'user', userId] : ['admin', 'user', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminUserSummary }>(
        `/admin/users/${userId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(userId),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      role?: AdminRole;
      status?: AdminUserStatus;
    }) => {
      const { id, ...rest } = input;
      const res = await apiClient.put<{ success: true; data: AdminUserSummary }>(
        `/admin/users/${id}`,
        rest,
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'user', vars.id] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

// ----------------------------------------------------------------------------
// Businesses
// ----------------------------------------------------------------------------

export function useAdminBusinesses(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'businesses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{ success: true; data: Paginated<AdminBusinessSummary> }>(
        `/admin/businesses?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

export function useAdminBusiness(businessId: string | null | undefined) {
  return useQuery({
    queryKey: businessId ? ['admin', 'business', businessId] : ['admin', 'business', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: unknown }>(
        `/admin/businesses/${businessId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });
}

// ----------------------------------------------------------------------------
// Professionals
// ----------------------------------------------------------------------------

export function useAdminProfessionals(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'professionals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{ success: true; data: Paginated<AdminProfessionalSummary> }>(
        `/admin/professionals?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

export function useAdminProfessional(professionalId: string | null | undefined) {
  return useQuery({
    queryKey: professionalId ? ['admin', 'professional', professionalId] : ['admin', 'professional', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: unknown }>(
        `/admin/professionals/${professionalId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(professionalId),
  });
}

// ----------------------------------------------------------------------------
// Payments
// ----------------------------------------------------------------------------

export function useAdminPayments(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{ success: true; data: Paginated<AdminPaymentSummary> }>(
        `/admin/billing/payments?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

export function useAdminPayment(paymentId: string | null | undefined) {
  return useQuery({
    queryKey: paymentId ? ['admin', 'payment', paymentId] : ['admin', 'payment', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminPaymentSummary }>(
        `/admin/billing/payments/${paymentId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(paymentId),
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; amount?: number; reason: string }) => {
      const { id, ...rest } = input;
      const res = await apiClient.post<{ success: true; data: AdminPaymentSummary }>(
        `/admin/billing/payments/${id}/refund`,
        rest,
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Refund recorded');
      qc.invalidateQueries({ queryKey: ['admin', 'payments'] });
      qc.invalidateQueries({ queryKey: ['admin', 'payment', vars.id] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

// ----------------------------------------------------------------------------
// Subscriptions
// ----------------------------------------------------------------------------

export function useAdminSubscriptions(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{
        success: true;
        data: Paginated<AdminSubscriptionSummary>;
      }>(`/admin/billing/subscriptions?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useAdminSubscription(subscriptionId: string | null | undefined) {
  return useQuery({
    queryKey: subscriptionId ? ['admin', 'subscription', subscriptionId] : ['admin', 'subscription', 'none'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminSubscriptionSummary }>(
        `/admin/billing/subscriptions/${subscriptionId}`,
      );
      return res.data.data;
    },
    enabled: Boolean(subscriptionId),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; reason: string }) => {
      const { id, ...rest } = input;
      const res = await apiClient.post<{ success: true; data: AdminSubscriptionSummary }>(
        `/admin/billing/subscriptions/${id}/cancel`,
        rest,
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Subscription cancelled');
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'subscription', vars.id] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

export function useOverrideSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      plan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
      validUntil?: string;
    }) => {
      const { id, ...rest } = input;
      const res = await apiClient.post<{ success: true; data: AdminSubscriptionSummary }>(
        `/admin/billing/subscriptions/${id}/override`,
        rest,
      );
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Plan overridden');
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'subscription', vars.id] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

// ----------------------------------------------------------------------------
// Contact requests
// ----------------------------------------------------------------------------

export function useAdminContactRequests(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'contact-requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{
        success: true;
        data: Paginated<AdminContactRequestSummary>;
      }>(`/admin/contact-requests?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useUpdateContactRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
      response?: string;
    }) => {
      const { id, ...rest } = input;
      const res = await apiClient.put<{ success: true; data: AdminContactRequestSummary }>(
        `/admin/contact-requests/${id}`,
        rest,
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['admin', 'contact-requests'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}

// ----------------------------------------------------------------------------
// Audit log
// ----------------------------------------------------------------------------

export function useAdminAuditLogs(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      const res = await apiClient.get<{ success: true; data: Paginated<AdminAuditLog> }>(
        `/admin/audit-logs?${params.toString()}`,
      );
      return res.data.data;
    },
  });
}

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminSetting[] }>(
        `/admin/settings`,
      );
      return res.data.data;
    },
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; value: unknown }) => {
      const { key, value } = input;
      const res = await apiClient.put<{ success: true; data: AdminSetting }>(
        `/admin/settings/${encodeURIComponent(key)}`,
        { value },
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Setting saved');
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
}