'use client';

import * as React from 'react';
import { ThumbsUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useSession } from '@/lib/store/session';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';

interface HelpfulButtonProps {
  businessId: string;
  reviewId: string;
  initialCount: number;
  initialVoted?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Chrome-style "Helpful" button — a quiet pill that increments the
 * review's helpful vote count optimistically and calls the backend.
 *
 * Unauthenticated behaviour: when there's no session the button is
 * disabled and the aria-label / title explains that sign-in is
 * required. The actual redirect-to-login flow lives on the parent
 * page (e.g. a signed-out CTA pointing at `/login?next=…`).
 *
 * The mutation is idempotent on the server — voting twice from the
 * same session doesn't double-count. We do an optimistic decrement if
 * the user un-clicks via the same button.
 */
export function HelpfulButton({
  businessId,
  reviewId,
  initialCount,
  initialVoted = false,
  disabled,
  className,
}: HelpfulButtonProps) {
  const session = useSession((s) => s.session);
  const isAuthed = Boolean(session);
  const qc = useQueryClient();

  const [count, setCount] = React.useState(initialCount);
  const [voted, setVoted] = React.useState(initialVoted);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: true; data: { count: number; voted: boolean } }>(
        `/reviews/${reviewId}/helpful`,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setCount(data.count);
      setVoted(data.voted);
      // Invalidate the review list so the histogram and list reflect
      // the new totals on next fetch.
      qc.invalidateQueries({ queryKey: ['reviews', 'list', businessId] });
    },
  });

  const handleClick = () => {
    if (disabled || !isAuthed) return;
    // Optimistic toggle.
    setVoted((prev) => {
      const next = !prev;
      setCount((c) => c + (next ? 1 : -1));
      return next;
    });
    mutation.mutate();
  };

  const label = !isAuthed
    ? 'Sign in to mark this review as helpful'
    : voted
      ? 'You marked this review as helpful. Click to undo.'
      : 'Mark this review as helpful';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !isAuthed || mutation.isPending}
      aria-pressed={voted}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 px-3 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        voted
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
        (disabled || !isAuthed) && 'cursor-not-allowed opacity-60 hover:bg-card',
        className,
      )}
    >
      <ThumbsUp
        className={cn('h-3.5 w-3.5', voted && 'fill-primary')}
        aria-hidden
      />
      <span>Helpful</span>
      <span className="tabular-nums text-foreground/70">({count})</span>
    </button>
  );
}
