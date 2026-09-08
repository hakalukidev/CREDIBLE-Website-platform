'use client';

/**
 * Friendly, user-facing error rendering.
 *
 * Never render `extractError(err).message` directly — it can leak internal
 * details like HTTP status, framework errors, axios messages, etc. This
 * component and `friendlyMessage` map errors to a small, well-controlled
 * set of user-friendly copy.
 *
 *     <FriendlyError kind="reviews" />
 *     toast.error(friendlyMessage(err, 'login'))
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FriendlyErrorKind =
  | 'reviews'
  | 'review-edit'
  | 'businesses'
  | 'professional'
  | 'profile'
  | 'plans'
  | 'kpis'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'upload'
  | 'subscription'
  | 'verification'
  | 'admin'
  | 'generic';

const COPY: Record<
  FriendlyErrorKind,
  { title: string; body: string }
> = {
  reviews: {
    title: 'Reviews are unavailable right now',
    body: "We couldn't load the reviews. Please refresh the page in a moment.",
  },
  'review-edit': {
    title: 'Review editor unavailable',
    body: "We couldn't load this review. It may have been removed or is no longer editable.",
  },
  businesses: {
    title: 'Directory unavailable',
    body: "We couldn't load businesses right now. Please try again in a moment.",
  },
  professional: {
    title: 'Profile unavailable',
    body: "We couldn't load this professional's profile. Please try again later.",
  },
  profile: {
    title: 'Profile unavailable',
    body: "We couldn't load your profile right now. Please refresh the page.",
  },
  plans: {
    title: 'Pricing unavailable',
    body: "We couldn't load our pricing right now. Please refresh the page in a moment.",
  },
  kpis: {
    title: 'Dashboard unavailable',
    body: "We couldn't load your dashboard data. Please refresh the page.",
  },
  login: {
    title: 'Sign in failed',
    body: 'Please check your email and password and try again.',
  },
  register: {
    title: "We couldn't create your account",
    body: 'Please double-check the form and try again.',
  },
  'forgot-password': {
    title: 'Password reset unavailable',
    body: 'Please try again in a moment. If the problem persists, contact support.',
  },
  upload: {
    title: 'Upload failed',
    body: "We couldn't upload your file. Please try again.",
  },
  subscription: {
    title: 'Subscription unavailable',
    body: "We couldn't load your subscription. Please refresh the page.",
  },
  verification: {
    title: 'Verification unavailable',
    body: "We couldn't load the verification details. Please refresh the page.",
  },
  admin: {
    title: 'Admin data unavailable',
    body: "We couldn't load admin data. Please refresh the page.",
  },
  generic: {
    title: 'Something went wrong',
    body: 'Please try again in a moment.',
  },
};

/**
 * Map an unknown error to a user-facing message. Never returns the raw
 * `extractError(err).message` text — only well-controlled copy.
 */
export function friendlyMessage(
  _err: unknown,
  kind: FriendlyErrorKind = 'generic',
): string {
  return COPY[kind]?.body ?? COPY.generic.body;
}

interface FriendlyErrorProps {
  kind?: FriendlyErrorKind;
  title?: string;
  body?: string;
  className?: string;
  variant?: 'banner' | 'inline';
}

export function FriendlyError({
  kind = 'generic',
  title,
  body,
  className,
  variant = 'banner',
}: FriendlyErrorProps) {
  const copy = COPY[kind] ?? COPY.generic;
  const resolvedTitle = title ?? copy.title;
  const resolvedBody = body ?? copy.body;

  if (variant === 'inline') {
    return (
      <p
        role="status"
        aria-live="polite"
        className={cn('text-sm text-muted-foreground', className)}
      >
        {resolvedBody}
      </p>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4 text-sm',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <p className="font-medium text-foreground">{resolvedTitle}</p>
        <p className="mt-1 text-muted-foreground">{resolvedBody}</p>
      </div>
    </div>
  );
}
