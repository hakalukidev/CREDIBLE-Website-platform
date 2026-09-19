'use client';

import type { Route } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CircleAlert,
  RefreshCcw,
  ShieldCheck,
  ShieldOff,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useVerificationStatus,
  type VerificationStatusKey,
  type VerificationTarget,
} from './verification-hooks';

interface Props {
  /** Profile type this banner is rendered for. */
  target: VerificationTarget;
  /** The business or professional id. */
  entityId: string | null | undefined;
  /**
   * Optional override for where the "Apply" / "Manage" CTA should point.
   * Defaults are `/business/verification` and `/professional/verification`.
   * Ignored when `onCta` is provided.
   */
  ctaHref?: string;
  /**
   * Optional click handler. When provided, the CTA buttons render as plain
   * `<Button onClick={onCta}>` instead of `<Link href={ctaHref ?? defaultCta(target)}>`.
   * Useful for opening a popup dialog over the dashboard rather than navigating.
   */
  onCta?: () => void;
  /** Hide the banner once the user is approved (the badge widget takes over). */
  hideWhenApproved?: boolean;
}

/**
 * Status banner shown on profile / dashboard pages. Renders nothing once the
 * owner is approved unless explicitly told to keep rendering (useful in
 * dashboards that want to celebrate the badge). Otherwise it surfaces the
 * appropriate CTA for the current state.
 */
export function VerificationStatusBanner({
  target,
  entityId,
  ctaHref,
  onCta,
  hideWhenApproved = true,
}: Props) {
  const { data, isLoading } = useVerificationStatus(target, entityId);

  if (isLoading) return <Skeleton className="h-20" />;
  if (!data) return null;

  const status: VerificationStatusKey = data.status ?? 'NOT_STARTED';
  if (hideWhenApproved && status === 'APPROVED') return null;

  const href = ctaHref ?? defaultCta(target);
  return (
    <Banner
      status={status}
      href={href}
      onCta={onCta}
      rejectionReason={data.application?.rejectionReason}
      level={data.application?.level ?? null}
      entityKind={target}
    />
  );
}

function defaultCta(target: VerificationTarget): string {
  return target === 'business'
    ? '/business/verification'
    : '/professional/verification';
}

/**
 * Renders the appropriate CTA for the given status. When `onCta` is provided,
 * a plain `<Button onClick>` is rendered so the host (typically the dashboard
 * layout) can intercept the click and open a popup dialog. Otherwise we fall
 * back to `<Button asChild><Link href={href}></Link></Button>` so navigation
 * continues to work for non-dialog consumers.
 */
function CtaButton({
  onCta,
  href,
  variant = 'default',
  size = 'sm',
  className,
  children,
}: {
  onCta?: () => void;
  href: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
  className?: string;
  children: React.ReactNode;
}) {
  if (onCta) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={onCta}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href as Route}>{children}</Link>
    </Button>
  );
}

function Banner({
  status,
  href,
  onCta,
  rejectionReason,
  level,
  entityKind,
}: {
  status: VerificationStatusKey;
  href: string;
  onCta?: () => void;
  rejectionReason?: string | null;
  level: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM' | null;
  entityKind: VerificationTarget;
}) {
  const noun = entityKind === 'business' ? 'business' : 'professional';

  switch (status) {
    case 'NOT_STARTED':
    case 'PENDING':
      return (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  Get the Credible Verified badge
                </p>
                <p className="text-xs text-muted-foreground">
                  Stand out on your public profile and unlock premium embed
                  features for your {noun}.
                </p>
              </div>
            </div>
            <CtaButton onCta={onCta} href={href}>
              Start verification <ArrowRight className="h-4 w-4" />
            </CtaButton>
          </CardContent>
        </Card>
      );

    case 'DOCUMENTS_UPLOADED':
    case 'AUTO_CHECKING':
    case 'HUMAN_REVIEW_REQUIRED':
      return (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <RefreshCcw className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Verification in progress
                </p>
                <p className="text-xs text-amber-800">
                  Our AI and review team are checking your application. You&apos;ll
                  get an email the moment we have an update.
                </p>
              </div>
            </div>
            <CtaButton onCta={onCta} href={href} variant="outline">
              View progress
            </CtaButton>
          </CardContent>
        </Card>
      );

    case 'REJECTED':
      return (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldOff className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Verification rejected
                </p>
                <p className="text-xs text-muted-foreground">
                  {rejectionReason ?? 'See the verification page for details.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CtaButton onCta={onCta} href={href} variant="outline">
                See details
              </CtaButton>
              <CtaButton onCta={onCta} href={href}>
                Resubmit
              </CtaButton>
            </div>
          </CardContent>
        </Card>
      );

    case 'APPROVED':
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-green-700" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Credible Verified
                  {level && level !== 'NONE' ? (
                    <Badge variant="success" className="ml-2">
                      {level}
                    </Badge>
                  ) : null}
                </p>
                <p className="text-xs text-green-800">
                  Your {noun} is showing the Credible Verified badge.
                </p>
              </div>
            </div>
            <CtaButton onCta={onCta} href={href} variant="outline">
              Manage badge
            </CtaButton>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Verification status unavailable.
            </span>
          </CardContent>
        </Card>
      );
  }
}
