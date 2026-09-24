'use client';

/**
 * useOwnerAccount — fetches the signed-in user's own account fields.
 *
 * The public `useProfileV2` (backed by `/users/by-username/:u`) deliberately
 * omits `email` and `phone` so visitors can't harvest them. This hook hits
 * `GET /users/me` which returns the SAFE_USER_SELECT projection that
 * includes `email`, `phone`, and `usernameChangedCount` so the owner-only
 * About tab can render editable rows.
 *
 * The hook reuses the `qk.users.me()` cache key so anywhere else in the
 * app that already fetches the owner profile stays in sync.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export interface OwnerAccount {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  username: string | null;
  slug: string | null;
  phone: string | null;
  usernameChangedCount: number;
}

export interface UseOwnerAccountResult {
  account: OwnerAccount | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useOwnerAccount(): UseOwnerAccountResult {
  const query = useQuery({
    queryKey: qk.users.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: OwnerAccount }>('/users/me');
      return res.data.data;
    },
    retry: 1,
    staleTime: 30_000,
  });

  return {
    account: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}