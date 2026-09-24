'use client';

/**
 * YourBusinessSection — list of business pages the user owns.
 *
 * Only rendered when the profile has a `business`. The "professional"
 * page is intentionally NOT listed here — the profile page exposes the
 * professional identity via the "Switch to professional" header button
 * (and via the `/professional/profile` dashboard). Mixing the two
 * under one heading felt confusing, so each gets its own affordance.
 *
 * The "Edit" affordance is shown for the owner only.
 */

import Link from 'next/link';
import { Building2, Pencil, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { ProfileV2OwnedPage } from '@/lib/hooks/use-profile-v2';

export interface YourBusinessSectionProps {
  business: ProfileV2OwnedPage | null;
}

export function YourBusinessSection({ business }: YourBusinessSectionProps) {
  if (!business) {
    return (
      <Card className="p-6 text-center">
        <p className="font-display text-lg font-semibold">No business page yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a business to start collecting verified reviews.
        </p>
        <Button asChild className="mt-4">
          <Link href={'#register' as never}>
            Register a business
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-md">
      <BusinessCard business={business} />
    </div>
  );
}

function BusinessCard({ business }: { business: ProfileV2OwnedPage }) {
  const preview = business.coverImage ?? business.logo ?? null;
  const viewHref = `/businesses/${business.slug}` as never;
  const editHref = '/business/profile' as never;
  const status = business.status?.toLowerCase();

  return (
    <Card className="overflow-hidden">
      <div
        className="relative h-24 w-full"
        style={{
          background: preview
            ? `url(${preview}) center / cover no-repeat`
            : 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)',
        }}
        aria-hidden
      />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-background">
            {business.logo && (
              <AvatarImage src={business.logo} alt={business.displayName} />
            )}
            <AvatarFallback className="bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{business.displayName}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="capitalize">
                Business
              </Badge>
              {status && (
                <Badge variant="outline" className="capitalize">
                  {status}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5">
            <Link href={viewHref}>
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1 gap-1.5">
            <Link href={editHref}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
