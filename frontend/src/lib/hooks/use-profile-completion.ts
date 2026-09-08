'use client';

/**
 * Derives a profile-completion percent + checklist from data the page
 * already has on hand. We intentionally don't hit a backend endpoint
 * for this — the backend doesn't expose one and the signal would be
 * stale anyway. The items reflect what's measurable from
 * `useSession` + `/users/me` + owned-entity presence.
 *
 * Items shown:
 *   - Email on file           → true once /users/me succeeds (assumed verified)
 *   - Display name set        → firstName or lastName
 *   - Profile photo uploaded  → avatar URL present
 *   - Page registered         → business or professional owned
 *
 * Returned `percent` is the share of items that are complete, rounded
 * to the nearest integer. So 4/4 → 100, 2/4 → 50.
 */

interface MinimalUser {
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
}

interface MinimalEntity {
  id?: string | null;
}

interface ProfileCompletionInput {
  user: MinimalUser | null | undefined;
  business: MinimalEntity | null | undefined;
  professional: MinimalEntity | null | undefined;
}

export interface ProfileCompletionItem {
  id: string;
  label: string;
  complete: boolean;
}

export interface ProfileCompletion {
  percent: number;
  items: ProfileCompletionItem[];
}

export function useProfileCompletion({
  user,
  business,
  professional,
}: ProfileCompletionInput): ProfileCompletion {
  const items: ProfileCompletionItem[] = [
    {
      id: 'email',
      label: 'Email on file',
      // The /users/me call succeeds → user is signed in. Treat as complete.
      complete: Boolean(user),
    },
    {
      id: 'name',
      label: 'Display name set',
      complete: Boolean(
        (user?.firstName && user.firstName.trim()) ||
          (user?.lastName && user.lastName.trim()),
      ),
    },
    {
      id: 'avatar',
      label: 'Profile photo uploaded',
      complete: Boolean(user?.avatar && user.avatar.trim().length > 0),
    },
    {
      id: 'page',
      label: 'Page registered',
      complete: Boolean(business?.id) || Boolean(professional?.id),
    },
  ];

  const total = items.length;
  const done = items.filter((i) => i.complete).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { percent, items };
}
