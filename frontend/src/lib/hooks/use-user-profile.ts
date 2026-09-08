'use client';

/**
 * Tiny hook that wraps the existing `GET /users/me` query and exposes
 * derived values (full name, initials, role label, status label,
 * member-since label) so multiple subcomponents on the profile page
 * can share the data instead of each running its own `useQuery`.
 *
 * `GET /users/me` actually returns `id, email, firstName, lastName,
 * avatar, role, status, createdAt`. The backend doesn't return a
 * phone field today, so the hook types it as optional — the row in
 * the page simply shows "Not provided" when the field is absent.
 *
 * Labels mirror the same mappings the sidebar uses for role, so the
 * chip on the profile header matches the chip in the navigation.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { initials as buildInitials } from '@credible/shared';

export interface MeUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  status?: string | null;
  createdAt?: string | null;
  phone?: string | null;
}

export interface UseUserProfile {
  user: MeUser | null;
  isLoading: boolean;
  isError: boolean;
  fullName: string;
  initials: string;
  memberSinceLabel: string | null;
  roleLabel: string;
  statusLabel: string | null;
  refetch: () => void;
}

function roleLabelFor(role?: string | null): string {
  if (!role) return 'Member';
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'BUSINESS':
      return 'Business owner';
    case 'PROFESSIONAL':
      return 'Professional';
    default:
      return 'Member';
  }
}

function statusLabelFor(status?: string | null): string | null {
  if (!status) return null;
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'SUSPENDED':
      return 'Suspended';
    case 'PENDING_VERIFICATION':
      return 'Pending verification';
    case 'DELETED':
      return 'Deleted';
    default:
      // Surface the raw status if we don't recognise it — better than
      // silently mislabelling an account state.
      return status.replace(/_/g, ' ').toLowerCase();
  }
}

function memberSinceLabelFor(createdAt?: string | null): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return `Member since ${d.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })}`;
}

export function useUserProfile(): UseUserProfile {
  const query = useQuery({
    queryKey: qk.users.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: MeUser }>(
        '/users/me',
      );
      return res.data.data;
    },
    retry: false,
  });

  const user = query.data ?? null;
  const fullName =
    [user?.firstName, user?.lastName]
      .filter((s): s is string => Boolean(s && s.trim()))
      .join(' ') ||
    user?.email ||
    'Unnamed user';

  return {
    user,
    isLoading: query.isLoading,
    isError: query.isError,
    fullName,
    initials: buildInitials(user?.firstName, user?.lastName) || '?',
    memberSinceLabel: memberSinceLabelFor(user?.createdAt),
    roleLabel: roleLabelFor(user?.role),
    statusLabel: statusLabelFor(user?.status),
    refetch: () => {
      void query.refetch();
    },
  };
}
