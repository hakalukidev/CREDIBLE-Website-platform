'use client';

import { ThumbsUp, Flag, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/reviews/star-rating';
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
  onRespond?: (review: ReviewItemModel) => void;
  onReport?: (review: ReviewItemModel) => void;
  className?: string;
}

export function ReviewItem({ review, viewer, onRespond, onReport, className }: ReviewItemProps) {
  const authorName = review.user.firstName ?? 'Anonymous';
  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Avatar>
            {review.user.avatar && (
              <AvatarImage src={review.user.avatar} alt={authorName} />
            )}
            <AvatarFallback>{authorName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{authorName}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(review.createdAt)}</p>
              </div>
              <StarRating value={review.rating} ariaLabel={`Rated ${review.rating} of 5`} />
            </div>

            {review.title && <h4 className="mt-2 font-semibold">{review.title}</h4>}
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line">{review.content}</p>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({review.helpfulCount})
              </span>
              {viewer === 'OWNER' ? (
                <>
                  {onRespond && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-1 text-xs"
                      onClick={() => onRespond(review)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Respond
                    </Button>
                  )}
                  {onReport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-1 text-xs hover:text-destructive"
                      onClick={() => onReport(review)}
                    >
                      <Flag className="h-3.5 w-3.5" /> Report
                    </Button>
                  )}
                </>
              ) : (
                onReport && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-destructive"
                    onClick={() => onReport(review)}
                  >
                    <Flag className="h-3.5 w-3.5" /> Report
                  </button>
                )
              )}
            </div>

            {review.responseContent && (
              <div className="mt-3 rounded-md border-l-4 border-primary bg-muted/40 p-3 text-sm">
                <p className="text-xs font-medium text-primary">Business response</p>
                <p className="mt-1 whitespace-pre-line">{review.responseContent}</p>
                {review.responseAt && (
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelative(review.responseAt)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}