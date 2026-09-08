'use client';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import { apiClient } from '@/lib/api/client';

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
}

/**
 * Shared hook for the public category list — same shape as `/categories`
 * returns. Used by the search filter, the business profile editor, and
 * the professional profile editor. Centralising the query key + cache
 * settings means switching categories anywhere keeps all dropdowns in
 * sync via TanStack Query's deduplication.
 */
export function useCategories() {
  return useQuery({
    queryKey: qk.categories.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: CategoryOption[] }>(
        '/categories',
      );
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
