'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Notification badges for the admin sidebar. Polled on mount (and refetched
 * on window focus) so pending work shows up without a manual refresh.
 */

interface AdminStats {
  pendingReview: number;
}

export function useAdminBadgeCounts() {
  const verification = useQuery({
    queryKey: ['admin', 'badges', 'verification'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: AdminStats }>(
        '/admin/verification/stats',
      );
      return res.data.data.pendingReview ?? 0;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const flagged = useQuery({
    queryKey: ['admin', 'badges', 'flagged'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: { total: number } }>(
        '/admin/reviews?status=FLAGGED&perPage=1',
      );
      return res.data.data.total ?? 0;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const pendingModeration = useQuery({
    queryKey: ['admin', 'badges', 'pending-moderation'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: { total: number } }>(
        '/admin/reviews?status=PENDING_MODERATION&perPage=1',
      );
      return res.data.data.total ?? 0;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return {
    verification: verification.data ?? 0,
    flagged: flagged.data ?? 0,
    pendingModeration: pendingModeration.data ?? 0,
  };
}