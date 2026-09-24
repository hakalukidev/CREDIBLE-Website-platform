'use client';

/**
 * /profile/[username] — the canonical public profile route.
 *
 * Centered at `max-w-5xl` (1024px) — a touch narrower than the homepage's
 * `container-wide` so the profile feels tighter without going back to
 * the old single-column `max-w-3xl` (768px). The inner
 * `ProfilePageContent` keeps its 2-column layout (sidebar + tabs) so the
 * profile still feels spacious without going full-bleed.
 *
 * The public-site Header + Footer are rendered automatically because this
 * route is NOT under `/dashboard/*` — `chrome-frame` only suppresses
 * chrome on `/dashboard/*` and `/admin/*`.
 *
 * The previous `/u/[username]` alias was deleted when we collapsed the
 * routing to a single canonical URL.
 */

import { use } from 'react';
import { ProfilePageContent } from '@/components/profile-v2/profile-page-content';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function ProfileRoute({ params }: PageProps) {
  const { username } = use(params);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <ProfilePageContent username={username} />
    </div>
  );
}
