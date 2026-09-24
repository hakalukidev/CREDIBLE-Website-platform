'use client';

/**
 * SocialLinksCard — sidebar card that owns the user's social links.
 *
 * Read-only row of brand-coloured icons, plus an "Add link" button
 * (owner-only) that opens a Popover editor. Edits inside the Popover
 * mutate the *draft* (via `setSocialLinks`); persistence happens only
 * when the user clicks the SectionCard footer's "Save N changes".
 *
 * Originally lived inside `profile-header.tsx` — moved here so the
 * header stays focused on identity and the sidebar owns all link
 * editing. The Popover UX, platform palette and validation logic are
 * preserved verbatim.
 */

import { useState } from 'react';
import { Link as LinkIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SectionCard } from './section-card';
import type {
  ProfileV2SocialLink,
  SocialPlatform,
} from '@/lib/hooks/use-profile-v2';

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  website: 'Website',
};

const PLATFORM_ICON_BG: Record<SocialPlatform, string> = {
  facebook: 'bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/15',
  instagram: 'bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/15',
  twitter: 'bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/15',
  linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/15',
  youtube: 'bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/15',
  website: 'bg-muted text-muted-foreground hover:bg-muted/80',
};

export interface SocialLinksCardProps {
  links: ProfileV2SocialLink[];
  isOwner: boolean;
  isDirty: boolean;
  isSaving: boolean;
  dirtyCount: number;
  onChange: (next: { platform: SocialPlatform; url: string }[]) => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
}

export function SocialLinksCard({
  links,
  isOwner,
  isDirty,
  isSaving,
  dirtyCount,
  onChange,
  onSave,
  onDiscard,
}: SocialLinksCardProps) {
  const [editing, setEditing] = useState(false);
  // Local Popover draft — kept inside the Popover so the *card-level*
  // draft stays unchanged until the user clicks "Save inside popover".
  // Cancelling the Popover discards this local copy.
  const [draft, setDraft] = useState<{ platform: SocialPlatform; url: string }[]>([]);

  function startEdit() {
    setDraft(links.map((l) => ({ platform: l.platform, url: l.url })));
    setEditing(true);
  }

  function commitDraft() {
    const clean = draft
      .map((d) => ({ ...d, url: d.url.trim() }))
      .filter((d) => d.url && isUrl(d.url));
    if (clean.length !== draft.length) {
      toast.error('One or more URLs are invalid.');
      return;
    }
    onChange(clean);
    setEditing(false);
  }

  return (
    <SectionCard
      title="Social links"
      icon={LinkIcon}
      isOwner={isOwner}
      isDirty={isDirty}
      isSaving={isSaving}
      dirtyCount={dirtyCount}
      onSave={onSave}
      onDiscard={onDiscard}
    >
      <div className="flex flex-wrap items-center gap-2">
        {links.length === 0 && !isOwner && (
          <p className="text-xs text-muted-foreground">No links yet.</p>
        )}
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={PLATFORM_LABEL[link.platform]}
            className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${PLATFORM_ICON_BG[link.platform]}`}
          >
            <PlatformIcon platform={link.platform} className="h-4 w-4" />
          </a>
        ))}
        {isOwner && (
          <Popover
            open={editing}
            onOpenChange={(o) => (o ? startEdit() : setEditing(false))}
          >
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-8 gap-1.5 rounded-full px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {links.length ? 'Edit links' : 'Add link'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Up to 6 social links. Empty rows are ignored.
              </p>
              {draft.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    aria-label="Platform"
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={d.platform}
                    onChange={(e) => {
                      const next = [...draft];
                      next[idx] = { ...d, platform: e.target.value as SocialPlatform };
                      setDraft(next);
                    }}
                  >
                    {(Object.keys(PLATFORM_LABEL) as SocialPlatform[]).map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABEL[p]}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="https://"
                    value={d.url}
                    onChange={(e) => {
                      const next = [...draft];
                      next[idx] = { ...d, url: e.target.value };
                      setDraft(next);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Remove"
                    onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {draft.length < 6 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft([...draft, { platform: 'website', url: '' }])
                  }
                >
                  + Add another
                </Button>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={commitDraft}>
                  Save in popover
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </SectionCard>
  );
}

function PlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case 'facebook':
      return <span className={className} aria-hidden>f</span>;
    case 'instagram':
      return <span className={className} aria-hidden>◎</span>;
    case 'twitter':
      return <span className={className} aria-hidden>𝕏</span>;
    case 'linkedin':
      return <span className={className} aria-hidden>in</span>;
    case 'youtube':
      return <span className={className} aria-hidden>▶</span>;
    default:
      return <LinkIcon className={className} />;
  }
}

function isUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
