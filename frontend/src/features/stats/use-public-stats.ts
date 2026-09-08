'use client';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import { apiClient } from '@/lib/api/client';

export interface PublicStats {
  businesses: number;
  reviews: number;
  reviewers: number;
  years: number;
}

/**
 * Public marketing stats — used by the About page counters and the
 * Community Guidelines transparency section. The backend caches the
 * underlying counts for 60s, so we mirror that on the client to avoid
 * redundant requests when navigating between pages.
 */
export function usePublicStats() {
  return useQuery({
    queryKey: qk.stats.public(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: PublicStats }>(
        '/stats/public',
      );
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}
