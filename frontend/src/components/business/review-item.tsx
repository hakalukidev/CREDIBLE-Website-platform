'use client';

import { Flag, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/reviews/star-rating';
import { HelpfulButton } from '@/components/reviews/helpful-button';
import { formatRelative } from '@credible/shared';
import { cn } from '@/lib/utils';

export interface ReviewItemModel {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  responseContent?: string | null;
  responseAt?: string | null;
  helpfulCount: number;
  createdAt: string;
  businessId?: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  };
}

interface ReviewItemProps {
  review: ReviewItemModel;
  viewer: 'OWNER' | 'PUBLIC';
  /** Optional business id for invalidating the review list. */
  businessId?: string;
  onRespond?: (review: ReviewItemModel) => void;
  onReport?: (review: ReviewItemModel) => void;
  className?: string;
}

/**
 * Google / Chrome-style review card.
 *
 * Anatomy:
 *  ┌───────────────────────────────────────────────────────────────┐
 *  │ [avatar]  Name                          ★★★★★  5.0           │
 *  │           2 weeks ago                                        │
 *  │                                                               │
 *  │ <optional title — bold>                                       │
 *  │                                                               │
 *  │ Body of the review. Multi-line text, generous line height.    │
 *  │                                                               │
 *  │ [Helpful (12)]   [Share]   [Report]                           │
 *  │                                                               │
 *  │ ┃ Owner response — 1 week ago                                 │
 *  │ ┃ Thanks for the kind words, …                                │
 *  └───────────────────────────────────────────────────────────────┘
 */
export function ReviewItem({
  review,
  viewer,
  businessId,
  onRespond,
  onReport,
  className,
}: ReviewItemProps) {
  const authorName = review.user.firstName ?? 'Anonymous';
  const initials = authorName.charAt(0).toUpperCase();

  return (
    <article
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6',
        className,
      )}
    >
      {/* Header row — avatar + identity + rating */}
      <header className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          {review.user.avatar && (
            <AvatarImage src={review.user.avatar} alt={authorName} />
          )}
          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{authorName}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(review.createdAt)}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <StarRating value={review.rating} ariaLabel={`Rated ${review.rating} of 5`} />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </header>

      {/* Optional title */}
      {review.title && (
        <h4 className="mt-3 text-base font-semibold text-foreground">{review.title}</h4>
      )}

      {/* Body */}
      <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
        {review.content}
      </p>

      {/* Action row */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <HelpfulButton
          businessId={businessId ?? review.businessId ?? ''}
          reviewId={review.id}
          initialCount={review.helpfulCount}
        />

        {viewer === 'OWNER' ? (
          <>
            {onRespond && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => onRespond(review)}
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Respond
              </Button>
            )}
            {onReport && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs hover:text-destructive"
                onClick={() => onReport(review)}
              >
                <Flag className="mr-1.5 h-3.5 w-3.5" /> Report
              </Button>
            )}
          </>
        ) : (
          onReport && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onReport(review)}
            >
              <Flag className="mr-1.5 h-3.5 w-3.5" /> Report
            </Button>
          )
        )}
      </div>

      {/* Owner response — a soft tinted card with a coloured rail on the
          left to indicate it's a reply, not part of the original. */}
      {review.responseContent && (
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-4 border-l-4 border-l-primary">
          <p className="text-xs font-semibold text-primary">Response from the owner</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
            {review.responseContent}
          </p>
          {review.responseAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatRelative(review.responseAt)}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
