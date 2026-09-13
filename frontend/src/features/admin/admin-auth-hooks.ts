'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAdminSession, type AdminUser } from '@/lib/admin/admin-session';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface AdminLoginResponse {
  user: AdminUser;
  token: string;
  expiresIn: number;
}

export type AdminLoginResult = AdminLoginResponse | { twoFactorRequired: true };

// ----------------------------------------------------------------------------
// Login / 2FA / logout
// ----------------------------------------------------------------------------

/**
 * The one admin mutation. On success it places the admin session into the
 * separate admin store; the httpOnly cookie is set server-side by the
 * backend. A `twoFactorRequired` response means the caller should first send
 * a one-time code via `useAdminRequestOtp` and re-submit with `otp`.
 */
export function useAdminLogin() {
  const setSession = useAdminSession((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: {
      loginId: string;
      password: string;
      otp?: string;
    }): Promise<AdminLoginResult> => {
      const res = await apiClient.post<{ success: true; data: AdminLoginResult }>(
        '/admin/login',
        input,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      if ('token' in data) {
        setSession({
          user: data.user,
          token: data.token,
          expiresIn: data.expiresIn,
          acquiredAt: Date.now(),
        });
      }
    },
  });
}

/** Emails a one-time sign-in code to the admin (requires valid credentials). */
export function useAdminRequestOtp() {
  return useMutation({
    mutationFn: async (input: { loginId: string; password: string }) => {
      const res = await apiClient.post<{ success: true; data: { sent: boolean; devCode?: string } }>(
        '/admin/login/otp',
        input,
      );
      return res.data.data;
    },
  });
}

/** Clears the admin session locally and tells the backend (cookie cleanup). */
export function useAdminLogout() {
  const clear = useAdminSession((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/logout', {}).catch(() => undefined);
    },
    onSettled: () => clear(),
  });
}