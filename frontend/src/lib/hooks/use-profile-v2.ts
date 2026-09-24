'use client';

/**
 * useProfileV2 — fetches the public profile for `/profile/[username]`.
 *
 * The hook hits `GET /users/by-username/:username`, which returns the
 * full identity + the four join-table lists (socialLinks, skills,
 * experience, education) plus any business / professional page the
 * user owns.
 *
 * Owner detection — `isOwner` is true when the signed-in user's id
 * matches the profile id. We compare against `useCurrentUser()` so
 * the value updates immediately after login/logout.
 */

import { useQuery } from '@tanstack/react-query';
import { fullName as buildFullName } from '@credible/shared';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { useCurrentUser } from './use-current-user';

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'website';

export interface ProfileV2SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  position: number;
}

export interface ProfileV2Skill {
  id: string;
  label: string;
  position: number;
}

export interface ProfileV2Experience {
  id: string;
  role: string;
  company: string;
  logoUrl?: string | null;
  /** ISO date string. */
  startDate: string;
  /** ISO date string or null when "Present". */
  endDate: string | null;
  description?: string | null;
  position: number;
}

export interface ProfileV2Education {
  id: string;
  school: string;
  detail?: string | null;
  startYear: number | null;
  endYear: number | null;
  position: number;
}

export interface ProfileV2OwnedPage {
  id: string;
  slug: string;
  displayName: string;
  logo?: string | null;
  coverImage?: string | null;
  avatar?: string | null;
  status: string;
}

export interface ProfileV2 {
  id: string;
  username: string | null;
  slug: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  avatar: string | null;
  coverImage: string | null;
  coverColor: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  isHireable: boolean;
  role: string;
  status: string;
  createdAt: string;
  socialLinks: ProfileV2SocialLink[];
  skills: ProfileV2Skill[];
  experience: ProfileV2Experience[];
  education: ProfileV2Education[];
  business: ProfileV2OwnedPage | null;
  professional: ProfileV2OwnedPage | null;
}

export interface UseProfileV2Result {
  profile: ProfileV2 | null;
  isLoading: boolean;
  isError: boolean;
  isOwner: boolean;
  refetch: () => void;
}

export function useProfileV2(username: string): UseProfileV2Result {
  const viewer = useCurrentUser();

  const query = useQuery({
    queryKey: qk.users.byUsername(username),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: ProfileV2 }>(
        `/users/by-username/${encodeURIComponent(username)}`,
      );
      const raw = res.data.data;
      // Server returns `firstName`/`lastName`; UI wants a single string.
      const fullName = buildFullName(raw.firstName, raw.lastName) || raw.username || 'Member';
      return { ...raw, fullName };
    },
    retry: 1,
    staleTime: 30_000,
  });

  const profile = query.data ?? null;
  const isOwner = Boolean(viewer && profile && viewer.id === profile.id);

  return {
    profile,
    isLoading: query.isLoading,
    isError: query.isError,
    isOwner,
    refetch: () => {
      void query.refetch();
    },
  };
}
