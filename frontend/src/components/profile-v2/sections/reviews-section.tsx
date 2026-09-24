'use client';

/**
 * ReviewsSection — single-column content for the "Reviews" tab.
 *
 * Toggles between two lists when the viewer owns at least one page:
 *   • "I wrote"     — reviews the user authored (`GET /reviews/me`).
 *   • "About me"    — reviews written about the user's business
 *                     (`GET /businesses/me/reviews`) and about their
 *                     professional profile (`GET /professionals/me/reviews`).
 *
 * When the user has no business / professional page, the "About me"
 * toggle is hidden so we don't expose an empty list.
 *
 * Visitors (non-owners) only see the "About me" list (read-only) — they
 * don't have a notion of "reviews I wrote" because they're viewing
 * someone else's profile.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

import { Card } from '@/components/ui/card';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ReviewsMode = 'iwrote' | 'aboutme';

export interface ReviewsSectionProps {
  ownerId: string;
  isOwner: boolean;
  hasOwnedPages: boolean;
}

export function ReviewsSection({ isOwner, hasOwnedPages }: ReviewsSectionProps) {
  // Owners see both lists. Non-owners see only the "about me" list.
  const initialMode: ReviewsMode = isOwner ? 'iwrote' : 'aboutme';
  const [mode, setMode] = useState<ReviewsMode>(initialMode);

  const showAboutMe = !isOwner || hasOwnedPages;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold">Reviews</h2>
          {isOwner && showAboutMe && (
            <div className="inline-flex rounded-full bg-muted p-1 text-xs font-medium">
              <TogglePill
                active={mode === 'iwrote'}
                onClick={() => setMode('iwrote')}
              >
                Reviews I wrote
              </TogglePill>
              <TogglePill
                active={mode === 'aboutme'}
                onClick={() => setMode('aboutme')}
              >
                About me
              </TogglePill>
            </div>
          )}
        </div>

        {mode === 'iwrote' ? (
          <ReviewsIWriteList />
        ) : showAboutMe ? (
          <AboutMeList />
        ) : (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have a business or professional page yet, so there
            are no reviews to show here.
          </p>
        )}
      </Card>
    </div>
  );
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

// ───────────────────────────────────────────────────── Lists

function ReviewsIWriteList() {
  const query = useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: ReviewItemModel[];
        meta?: unknown;
      }>('/reviews/me');
      return res.data.data ?? [];
    },
  });

  if (query.isLoading) return <ReviewsSkeleton />;
  if (query.isError) {
    return <p className="text-sm text-muted-foreground">Could not load your reviews.</p>;
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t written any reviews yet.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((review) => (
        <li key={review.id}>
          <ReviewItem review={review} viewer="OWNER" />
        </li>
      ))}
    </ul>
  );
}

function AboutMeList() {
  const business = useQuery({
    queryKey: ['reviews', 'about-me', 'business'],
    queryFn: async () => {
      const res = await apiClient.get<unknown>('/businesses/me/reviews');
      return unwrapArray(res.data);
    },
    retry: false,
  });
  const professional = useQuery({
    queryKey: ['reviews', 'about-me', 'professional'],
    queryFn: async () => {
      const res = await apiClient.get<unknown>('/professionals/me/reviews');
      return unwrapArray(res.data);
    },
    retry: false,
  });

  const items = useMemo<ReviewItemModel[]>(
    () => [...(business.data ?? []), ...(professional.data ?? [])],
    [business.data, professional.data],
  );

  if (business.isLoading || professional.isLoading) return <ReviewsSkeleton />;
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reviews about you yet.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((review) => (
        <li key={review.id}>
          <ReviewItem review={review} viewer="OWNER" />
        </li>
      ))}
    </ul>
  );
}

function unwrapArray(raw: unknown): ReviewItemModel[] {
  // The owner endpoints return either a bare array or `{ data: [...] }` or
  // `{ items: [...], total }` envelope depending on version. Be tolerant.
  if (Array.isArray(raw)) return raw as ReviewItemModel[];
  if (raw && typeof raw === 'object') {
    const r = raw as { data?: unknown; items?: unknown };
    if (Array.isArray(r.data)) return r.data as ReviewItemModel[];
    if (Array.isArray(r.items)) return r.items as ReviewItemModel[];
  }
  return [];
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
