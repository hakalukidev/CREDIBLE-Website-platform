'use client';

/**
 * ProfilePageContent — orchestrator for `/profile/[username]`.
 * Owns the data-fetch + mutation wiring; renders a 2-col layout with
 * sidebar list cards (explicit-save drafts) and the right-column tabs.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QueryKey } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { useProfileV2, type ProfileV2 } from '@/lib/hooks/use-profile-v2';
import { useProfileDraft } from '@/lib/hooks/use-profile-draft';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { refreshSessionUser } from '@/lib/auth/refresh-session-user';
import type { AccountSectionApi } from './sections/account-section';

import { ProfileHeader } from './profile-header';
import { ProfileTabs, type ProfileTabDefinition } from './tabs-bar';
import { AboutSection } from './sections/about-section';
import { ReviewsSection } from './sections/reviews-section';
import { RegisterBusinessSection } from './sections/register-business-section';
import { YourBusinessSection } from './sections/your-business-section';
import { SocialLinksCard } from './sidebar/social-links-card';
import { SkillsCard } from './sidebar/skills-card';
import { EducationCard } from './sidebar/education-card';
import { ExperienceCard } from './sidebar/experience-card';
import { FriendlyError } from '@/components/ui/friendly-error';
import { Button } from '@/components/ui/button';
import { ProfileSkeleton } from './profile-skeleton';
import { SwitchToProfessionalDialog } from './switch-to-professional-dialog';
import { CreateProfessionalPageDialog } from './create-professional-page-dialog';
import type { SwitchMode } from './page-mode';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type TabId = 'about' | 'reviews' | 'register' | 'pages';

const HASH_TO_TAB: Record<string, TabId> = {
  '#about': 'about',
  '#reviews': 'reviews',
  '#register': 'register',
  '#pages': 'pages',
};

interface ProfilePageContentProps {
  username: string;
}

export function ProfilePageContent({ username }: ProfilePageContentProps) {
  const viewer = useCurrentUser();
  const qc = useQueryClient();
  const { profile: fetched, isLoading, isError, isOwner, refetch } = useProfileV2(username);

  const [tab, setTab] = useState<TabId>('about');
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [professionalDialogOpen, setProfessionalDialogOpen] = useState(false);
  const [professionalMode, setProfessionalMode] = useState<SwitchMode>('with-docs');

  // Honour deep-link hashes from the legacy /dashboard/* redirects
  // (`#reviews`, `#pages`, `#register`, `#about`). Only fires once on
  // mount so subsequent tab changes don't fight a stale hash.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = HASH_TO_TAB[window.location.hash.toLowerCase()];
    if (next && next !== tab) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidate = useCallback((keys: readonly QueryKey[]) => {
    keys.forEach((k) => {
      void qc.invalidateQueries({ queryKey: k });
    });
  }, [qc]);

  if (isLoading || !fetched) {
    return <ProfileSkeleton />;
  }

  if (isError && !fetched) {
    return (
      <div className="space-y-6">
        <ProfileSkeleton />
        <FriendlyError kind="profile" className="bg-card" />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const profile: ProfileV2 = fetched;
  const hasOwnedPages = Boolean(profile.business || profile.professional);

  return (
    <ProfileBody
      profile={profile}
      username={username}
      isOwner={isOwner}
      viewerFirstName={viewer?.firstName ?? null}
      viewerLastName={viewer?.lastName ?? null}
      tab={tab}
      setTab={setTab}
      switchDialogOpen={switchDialogOpen}
      setSwitchDialogOpen={setSwitchDialogOpen}
      professionalDialogOpen={professionalDialogOpen}
      setProfessionalDialogOpen={setProfessionalDialogOpen}
      professionalMode={professionalMode}
      setProfessionalMode={setProfessionalMode}
      viewerEmail={viewer?.email ?? null}
      hasPages={hasOwnedPages}
      onQueryInvalidate={invalidate}
    />
  );
}

// Splitting the rendered tree into a sub-component keeps the early
// returns (`isLoading`, `isError`) above clean — no hooks below the
// early returns, no useProfileDraft when the profile is null.
function ProfileBody({
  profile,
  username,
  isOwner,
  viewerFirstName,
  viewerLastName,
  tab,
  setTab,
  switchDialogOpen,
  setSwitchDialogOpen,
  professionalDialogOpen,
  setProfessionalDialogOpen,
  professionalMode,
  setProfessionalMode,
  viewerEmail,
  hasPages,
  onQueryInvalidate,
}: {
  profile: ProfileV2;
  username: string;
  isOwner: boolean;
  viewerFirstName: string | null;
  viewerLastName: string | null;
  tab: TabId;
  setTab: (t: TabId) => void;
  switchDialogOpen: boolean;
  setSwitchDialogOpen: (o: boolean) => void;
  professionalDialogOpen: boolean;
  setProfessionalDialogOpen: (o: boolean) => void;
  professionalMode: SwitchMode;
  setProfessionalMode: (m: SwitchMode) => void;
  viewerEmail: string | null;
  hasPages: boolean;
  onQueryInvalidate: (keys: readonly QueryKey[]) => void;
}) {
  const draft = useProfileDraft(profile, username);

  async function saveIdentity(next: {
    firstName: string;
    lastName: string;
    headline: string | null;
    location: string | null;
    bio: string | null;
    isHireable: boolean;
    website: string | null;
    username?: string | null;
  }) {
    try {
      const res = await apiClient.patch<{ success: true; data: { id: string; firstName: string | null; lastName: string | null; username: string | null; slug: string | null; usernameChangedCount: number } }>(
        '/users/me',
        {
          firstName: next.firstName,
          lastName: next.lastName,
          headline: next.headline,
          location: next.location,
          bio: next.bio,
          website: next.website,
          isHireable: next.isHireable,
          ...(next.username ? { username: next.username } : {}),
        },
      );
      // Keep the session user in sync so the header dropdown shows the
      // fresh name/username without a full reload.
      const updated = res.data.data;
      refreshSessionUser({
        id: updated.id,
        firstName: updated.firstName ?? undefined,
        lastName: updated.lastName ?? undefined,
      });
      onQueryInvalidate([qk.users.me(), qk.users.byUsername(username)]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save profile.';
      toast.error(msg);
      throw e;
    }
  }

  async function savePhone(next: string): Promise<void> {
    const res = await apiClient.patch<{ success: true; data: { id: string; phone: string | null } }>(
      '/users/me',
      { phone: next },
    );
    refreshSessionUser({ id: res.data.data.id });
    onQueryInvalidate([qk.users.me(), qk.users.byUsername(username)]);
  }

  async function requestEmailChange(
    newEmail: string,
    currentPassword: string,
  ): Promise<{ devCode?: string }> {
    const res = await apiClient.post<{ success: true; sent: true; devCode?: string }>(
      '/users/me/email/change-request',
      { newEmail, currentPassword },
    );
    return { devCode: res.data.devCode };
  }

  async function verifyEmailChange(newEmail: string, code: string): Promise<void> {
    const res = await apiClient.patch<{ success: true; data: { id: string; email: string } }>(
      '/users/me/email/change-verify',
      { newEmail, code },
    );
    refreshSessionUser({ id: res.data.data.id, email: res.data.data.email });
    onQueryInvalidate([qk.users.me(), qk.users.byUsername(username)]);
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/users/me/password', { currentPassword, newPassword });
  }

  const accountApi: AccountSectionApi = {
    saveUsername: async (next) => {
      // Username change is gated server-side: 2-edit-per-lifetime cap.
      await saveIdentity({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        headline: profile.headline,
        location: profile.location,
        bio: profile.bio,
        website: profile.website,
        isHireable: profile.isHireable,
        username: next,
      });
    },
    saveName: async ({ firstName, lastName }) => {
      await saveIdentity({
        firstName,
        lastName,
        headline: profile.headline,
        location: profile.location,
        bio: profile.bio,
        website: profile.website,
        isHireable: profile.isHireable,
      });
    },
    savePhone,
    saveAddress: async (next) => {
      await saveIdentity({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        headline: profile.headline,
        location: next,
        bio: profile.bio,
        website: profile.website,
        isHireable: profile.isHireable,
      });
    },
    requestEmailChange,
    verifyEmailChange,
    changePassword,
    // `onPatched` is filled in by AboutSection — it owns the local
    // optimistic state for the editable rows.
    onPatched: undefined,
  };

  async function saveAvatar(url: string) {
    try {
      await apiClient.patch('/users/me', { avatar: url });
      onQueryInvalidate([qk.users.me(), qk.users.byUsername(username)]);
    } catch {
      toast.error('Could not save photo.');
    }
  }

  async function removeAvatar() {
    try {
      await apiClient.patch('/users/me', { avatar: null });
      onQueryInvalidate([qk.users.me(), qk.users.byUsername(username)]);
    } catch {
      toast.error('Could not remove photo.');
    }
  }

  async function saveCover(input: { imageUrl?: string | null; color?: string | null }) {
    try {
      await apiClient.patch('/users/me', {
        coverImage: input.imageUrl ?? profile.coverImage,
        coverColor: input.color ?? profile.coverColor,
      });
      onQueryInvalidate([qk.users.me(), qk.users.byUsername(username)]);
    } catch {
      toast.error('Could not save cover.');
    }
  }

  // Tabs (conditionally rendered). The Register tab is reserved for
  // the signed-in owner who doesn't already own a business — the CTA
  // there leads to the in-profile creation dialog. The "Your business"
  // tab is only shown when the user owns a business page; the
  // professional page is intentionally exposed via the header button
  // and the professional dashboard, not as a tab.
  const tabs: ProfileTabDefinition<TabId>[] = [
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
  ];
  if (isOwner && !profile.business) {
    tabs.push({ id: 'register', label: 'Register a Business' });
  }
  if (profile.business) {
    tabs.push({ id: 'pages', label: 'Your business' });
  }

  const dirtySocial = draft.isDirty('socialLinks');
  const dirtySkills = draft.isDirty('skills');
  const dirtyEducation = draft.isDirty('education');
  const dirtyExperience = draft.isDirty('experience');

  return (
    <div className="space-y-8">
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        onSwitchToProfessional={() => setSwitchDialogOpen(true)}
        onSaveAvatar={saveAvatar}
        onRemoveAvatar={removeAvatar}
        onSaveCover={saveCover}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        {/* LEFT — sidebar. Sticky on lg+ so it follows the user as
            they scroll through the right column. */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SocialLinksCard
            links={draft.draft.socialLinks}
            isOwner={isOwner}
            isDirty={dirtySocial}
            isSaving={draft.savingSection === 'socialLinks'}
            dirtyCount={draft.diffCount('socialLinks')}
            onChange={(next) =>
              draft.setSection(
                'socialLinks',
                next.map((l, idx) => ({
                  // Mint a tmp id for items the user just added so the
                  // dirty comparison has something stable to look at.
                  id: `tmp-social-${idx}-${l.platform}`,
                  platform: l.platform,
                  url: l.url,
                  position: idx,
                })),
              )
            }
            onSave={() => void draft.save('socialLinks')}
            onDiscard={() => draft.discard('socialLinks')}
          />

          <SkillsCard
            skills={draft.draft.skills}
            isOwner={isOwner}
            isDirty={dirtySkills}
            isSaving={draft.savingSection === 'skills'}
            dirtyCount={draft.diffCount('skills')}
            onChange={(next) => draft.setSection('skills', next)}
            onSave={() => void draft.save('skills')}
            onDiscard={() => draft.discard('skills')}
          />

          <EducationCard
            education={draft.draft.education}
            isOwner={isOwner}
            isDirty={dirtyEducation}
            isSaving={draft.savingSection === 'education'}
            dirtyCount={draft.diffCount('education')}
            onChange={(next) => draft.setSection('education', next)}
            onSave={() => void draft.save('education')}
            onDiscard={() => draft.discard('education')}
          />

          <ExperienceCard
            experience={draft.draft.experience}
            isOwner={isOwner}
            isDirty={dirtyExperience}
            isSaving={draft.savingSection === 'experience'}
            dirtyCount={draft.diffCount('experience')}
            onChange={(next) => draft.setSection('experience', next)}
            onSave={() => void draft.save('experience')}
            onDiscard={() => draft.discard('experience')}
          />
        </aside>

        {/* RIGHT — tabs + tab content. */}
        <div className="space-y-6">
          <ProfileTabs<TabId>
            tabs={tabs}
            value={tab}
            onChange={setTab}
            idPrefix={`profile-${username}`}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="tabpanel"
              id={`profile-${username}-${tab}-panel`}
              aria-labelledby={`profile-${username}-${tab}`}
            >
              {tab === 'about' && (
                <AboutSection
                  profile={profile}
                  isOwner={isOwner}
                  onSaveIdentity={saveIdentity}
                  api={accountApi}
                />
              )}
              {tab === 'reviews' && (
                <ReviewsSection
                  ownerId={profile.id}
                  isOwner={isOwner}
                  hasOwnedPages={hasPages}
                />
              )}
              {tab === 'register' && (
                <RegisterBusinessSection
                  username={username}
                  prefill={{
                    firstName: viewerFirstName,
                    lastName: viewerLastName,
                    email: viewerEmail,
                  }}
                />
              )}
              {tab === 'pages' && (
                <YourBusinessSection business={profile.business} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <SwitchToProfessionalDialog
        open={switchDialogOpen}
        onOpenChange={setSwitchDialogOpen}
        onChoose={(mode) => {
          setProfessionalMode(mode);
          setSwitchDialogOpen(false);
          setProfessionalDialogOpen(true);
        }}
      />
      <CreateProfessionalPageDialog
        open={professionalDialogOpen}
        onOpenChange={setProfessionalDialogOpen}
        mode={professionalMode}
        username={username}
        prefill={{
          firstName: viewerFirstName,
          lastName: viewerLastName,
          email: viewerEmail,
        }}
      />
    </div>
  );
}
