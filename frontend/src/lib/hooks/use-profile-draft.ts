'use client';

/**
 * useProfileDraft — explicit-save buffer for the four sidebar lists.
 * Why: each sidebar card requires a "Save N changes" footer click before
 * anything reaches the server, so this hook owns the live-but-unsaved
 * draft for each section and gates persistence behind `save(key)`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type {
  ProfileV2,
  ProfileV2Education,
  ProfileV2Experience,
  ProfileV2Skill,
  ProfileV2SocialLink,
} from './use-profile-v2';

export type SectionKey = 'socialLinks' | 'skills' | 'experience' | 'education';

function arraysEqualAsSet<T extends { id: string }>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i];
    const bi = b[i];
    if (ai.id !== bi.id) return false;
    const aKeys = Object.keys(ai) as (keyof T)[];
    for (const k of aKeys) {
      if (k === 'id') continue;
      if ((ai as unknown as Record<string, unknown>)[k as string] !==
          (bi as unknown as Record<string, unknown>)[k as string]) {
        return false;
      }
    }
  }
  return true;
}

export interface ProfileDraft {
  socialLinks: ProfileV2SocialLink[];
  skills: ProfileV2Skill[];
  experience: ProfileV2Experience[];
  education: ProfileV2Education[];
}

export interface UseProfileDraftResult {
  draft: ProfileDraft;
  setSection: <K extends SectionKey>(key: K, next: ProfileDraft[K]) => void;
  patchSection: <K extends SectionKey>(key: K, patch: (prev: ProfileDraft[K]) => ProfileDraft[K]) => void;
  isDirty: (key: SectionKey) => boolean;
  /** Number of "logical" changes — used for the "Save N changes" badge. */
  diffCount: (key: SectionKey) => number;
  save: (key: SectionKey) => Promise<void>;
  discard: (key: SectionKey) => void;
  /** Section currently mid-save (used to disable the matching button). */
  savingSection: SectionKey | null;
  /** Last-error message per section, cleared on next save. */
  errorBySection: Partial<Record<SectionKey, string>>;
}

/** Add + remove + edit counts as 1 each. */
function countChanges<T extends { id: string }>(draft: T[], original: T[]): number {
  const originalIds = new Set(original.map((x) => x.id));
  const draftIds = new Set(draft.map((x) => x.id));

  let count = 0;
  for (const id of draftIds) if (!originalIds.has(id)) count += 1;
  for (const id of originalIds) if (!draftIds.has(id)) count += 1;
  for (const id of draftIds) {
    if (!originalIds.has(id)) continue;
    const a = draft.find((x) => x.id === id);
    const b = original.find((x) => x.id === id);
    if (!a || !b) continue;
    if (!arraysEqualAsSet([a] as T[], [b] as T[])) count += 1;
  }
  return count;
}

interface SectionEndpoint<K extends SectionKey> {
  path: string;
  bodyKey: string;
  bodyFor: (draft: ProfileDraft[K]) => unknown[];
}

const SECTION_ENDPOINTS: { [K in SectionKey]: SectionEndpoint<K> } = {
  socialLinks: {
    path: '/users/me/profile/social-links',
    bodyKey: 'links',
    bodyFor: (draft) =>
      (draft as ProfileV2SocialLink[]).map((l) => ({
        platform: l.platform,
        url: l.url,
      })),
  },
  skills: {
    path: '/users/me/profile/skills',
    bodyKey: 'skills',
    bodyFor: (draft) =>
      (draft as ProfileV2Skill[]).map((s) => ({ label: s.label })),
  },
  experience: {
    path: '/users/me/profile/experience',
    bodyKey: 'entries',
    bodyFor: (draft) =>
      (draft as ProfileV2Experience[]).map((e) => ({
        role: e.role,
        company: e.company,
        logoUrl: e.logoUrl ?? null,
        startDate: e.startDate,
        endDate: e.endDate ?? null,
        description: e.description ?? null,
      })),
  },
  education: {
    path: '/users/me/profile/education',
    bodyKey: 'entries',
    bodyFor: (draft) =>
      (draft as ProfileV2Education[]).map((ed) => ({
        school: ed.school,
        detail: ed.detail ?? null,
        startYear: ed.startYear ?? null,
        endYear: ed.endYear ?? null,
      })),
  },
};

async function persistSection<K extends SectionKey>(
  key: K,
  draft: ProfileDraft[K],
): Promise<ProfileDraft[K]> {
  const endpoint = SECTION_ENDPOINTS[key];
  const res = await apiClient.put<{ success: true; data: ProfileDraft[K] }>(
    endpoint.path,
    { [endpoint.bodyKey]: endpoint.bodyFor(draft) },
  );
  return res.data.data;
}

export function useProfileDraft(
  profile: ProfileV2,
  username: string,
): UseProfileDraftResult {
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<ProfileDraft>(() => ({
    socialLinks: profile.socialLinks,
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
  }));

  // `original` reflects the last committed snapshot. We refresh it
  // every time the server-fed profile changes (so a refetch invalidates
  // dirty state correctly) AND immediately after a successful save.
  const originalRef = useRef<ProfileDraft>({
    socialLinks: profile.socialLinks,
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
  });

  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [errorBySection, setErrorBySection] = useState<Partial<Record<SectionKey, string>>>({});

  // Refresh originals whenever the server profile changes (e.g. after
  // a refetch). For sections the user has already edited, we KEEP the
  // draft as-is so concurrent saves from other tabs don't silently wipe
  // unsaved work — `isDirty` will continue to return true until the
  // user discards or saves. Only the `original` baseline is refreshed
  // so the dirty check stays grounded in server truth.
  useEffect(() => {
    const next: ProfileDraft = {
      socialLinks: profile.socialLinks,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
    };
    setDraft((prev) => {
      const merged: ProfileDraft = {
        socialLinks: arraysEqualAsSet(prev.socialLinks as { id: string }[], next.socialLinks as { id: string }[])
          ? prev.socialLinks
          : next.socialLinks,
        skills: arraysEqualAsSet(prev.skills as { id: string }[], next.skills as { id: string }[])
          ? prev.skills
          : next.skills,
        experience: arraysEqualAsSet(prev.experience as { id: string }[], next.experience as { id: string }[])
          ? prev.experience
          : next.experience,
        education: arraysEqualAsSet(prev.education as { id: string }[], next.education as { id: string }[])
          ? prev.education
          : next.education,
      };
      return merged;
    });
    originalRef.current = next;
  }, [
    profile.socialLinks,
    profile.skills,
    profile.experience,
    profile.education,
    profile.id,
  ]);

  const setSection = useCallback(<K extends SectionKey>(key: K, next: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: next }));
  }, []);

  const patchSection = useCallback(
    <K extends SectionKey>(key: K, patch: (prev: ProfileDraft[K]) => ProfileDraft[K]) => {
      setDraft((prev) => ({ ...prev, [key]: patch(prev[key]) }));
    },
    [],
  );

  const isDirty = useCallback(
    (key: SectionKey) => {
      return !arraysEqualAsSet(draft[key] as { id: string }[], originalRef.current[key] as { id: string }[]);
    },
    [draft],
  );

  const diffCount = useCallback(
    (key: SectionKey) =>
      countChanges(
        draft[key] as { id: string }[],
        originalRef.current[key] as { id: string }[],
      ),
    [draft],
  );

  const save = useCallback(
    async (key: SectionKey) => {
      if (savingSection) return;
      setSavingSection(key);
      setErrorBySection((prev) => ({ ...prev, [key]: undefined }));
      try {
        const canonical = await persistSection(key, draft[key]);
        // Update both the draft (which may have carried tmp-* ids) and
        // the original snapshot to the canonical server response.
        setDraft((prev) => ({ ...prev, [key]: canonical }));
        originalRef.current = { ...originalRef.current, [key]: canonical };
        toast.success(
          key === 'socialLinks'
            ? 'Social links saved.'
            : key === 'skills'
              ? 'Skills saved.'
              : key === 'experience'
                ? 'Experience saved.'
                : 'Education saved.',
        );
        // Make sure any other consumer of the profile (e.g. the Header)
        // also gets the fresh data on next refetch.
        queryClient.invalidateQueries({ queryKey: qk.users.byUsername(username) });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : `Could not save ${key}.`;
        setErrorBySection((prev) => ({ ...prev, [key]: msg }));
        toast.error(msg);
      } finally {
        setSavingSection(null);
      }
    },
    [draft, queryClient, savingSection, username],
  );

  const discard = useCallback((key: SectionKey) => {
    setDraft((prev) => ({ ...prev, [key]: originalRef.current[key] }));
  }, []);

  return {
    draft,
    setSection,
    patchSection,
    isDirty,
    diffCount,
    save,
    discard,
    savingSection,
    errorBySection,
  };
}
