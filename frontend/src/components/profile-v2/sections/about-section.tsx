'use client';

/**
 * AboutSection — content for the "About" tab of `/profile/[username]`.
 *
 * Layout (owner view):
 *   • AccountSection         — username / name / email / phone / address / password
 *
 * The Skills / Experience / Education lists live in the sidebar (see
 * `sidebar/*-card.tsx`) where they're edited against an explicit-save
 * draft. Public identity (headline / bio / website) is rendered in the
 * header.
 */

import { useState } from 'react';

import type { ProfileV2 } from '@/lib/hooks/use-profile-v2';
import { useOwnerAccount, type OwnerAccount } from '@/lib/hooks/use-owner-account';
import { AccountSection, type AccountSectionApi } from './account-section';

export interface AboutSectionProps {
  profile: ProfileV2;
  isOwner: boolean;
  /** PATCH /users/me — used by the orchestrator, not directly here. */
  onSaveIdentity: (next: {
    firstName: string;
    lastName: string;
    headline: string | null;
    location: string | null;
    bio: string | null;
    isHireable: boolean;
    website: string | null;
    username?: string | null;
  }) => Promise<void> | void;
  /** Network calls wired up by the orchestrator. */
  api: AccountSectionApi;
}

export function AboutSection({ profile, isOwner, onSaveIdentity, api }: AboutSectionProps) {
  const { account, refetch } = useOwnerAccount();

  // Local mutable copy of the owner account so saves render immediately
  // without waiting for the server refetch.
  const [liveAccount, setLiveAccount] = useState<OwnerAccount | null>(null);
  const effectiveAccount: OwnerAccount | null = liveAccount ?? account ?? null;

  // Wrap the orchestrator's api so we can also patch the local snapshot
  // + refetch after every save (and route name/username/address through
  // the existing onSaveIdentity PATCH).
  const wired: AccountSectionApi = {
    ...api,
    saveUsername: async (next) => {
      await onSaveIdentity({
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
      await onSaveIdentity({
        firstName,
        lastName,
        headline: profile.headline,
        location: profile.location,
        bio: profile.bio,
        website: profile.website,
        isHireable: profile.isHireable,
      });
    },
    saveAddress: async (next) => {
      await onSaveIdentity({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        headline: profile.headline,
        location: next,
        bio: profile.bio,
        website: profile.website,
        isHireable: profile.isHireable,
      });
    },
    onPatched: (patch) => {
      if (!effectiveAccount) return;
      setLiveAccount({ ...effectiveAccount, ...patch });
      void refetch();
    },
  };

  return (
    <div className="space-y-6">
      {isOwner && effectiveAccount ? (
        <AccountSection account={effectiveAccount} address={profile.location} api={wired} />
      ) : null}
    </div>
  );
}
