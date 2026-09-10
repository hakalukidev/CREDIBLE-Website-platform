'use client';

/**
 * Dashboard Overview page content.
 *
 * Composes the existing dashboard primitives (`SectionCard`, `StatCard`,
 * `QuickActions`, `ProfileCompletionCard`, `EmptyState`) with two
 * Overview-specific components (`Hero`, `RecentReviewsCard`) to render a
 * premium, role-adaptive dashboard.
 *
 * Data sources (no backend changes; these all exist today):
 *   GET /users/me                                  — display name, avatar
 *   GET /reviews/me                                — reviews I've authored
 *   GET /businesses/me/profile                     — owned business summary
 *   GET /professionals/me/profile                  — owned professional summary
 *   GET /businesses/me/analytics?range=30d         — BUSINESS summary KPIs + trend
 *   GET /businesses/:id/verification/applications  — pending verification (BUSINESS)
 *
 * Loading / empty / error states are wired through the existing
 * `Skeleton`, `EmptyState`, and `FriendlyError` primitives so every
 * state looks polished.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  KeyRound,
  LineChart as LineChartIcon,
  MessageSquare,
  PencilLine,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { apiClient, isNotFound } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { useSession } from '@/lib/store/session';
import { useProfileCompletion } from '@/lib/hooks/use-profile-completion';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FriendlyError } from '@/components/ui/friendly-error';
import { SectionCard, SectionCardHeader } from '@/components/dashboard/primitives/section-card';
import { IconTile } from '@/components/dashboard/primitives/icon-tile';
import { StatCard, StatCardGrid } from '@/components/dashboard/overview/stat-card';
import { QuickActions } from '@/components/dashboard/overview/quick-actions';
import { ProfileCompletionCard } from '@/components/dashboard/overview/profile-completion-card';
import { Hero } from '@/components/dashboard/overview/hero';
import { RecentReviewsCard } from '@/components/dashboard/overview/recent-reviews-card';
import { MotionStagger } from '@/components/ui/motion-primitives';
import { LineChart } from '@/components/charts/LineChart';
import {
  formatRelative,
  formatRating,
  pluralize,
} from '@credible/shared';

interface MeUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
}

interface UserReview {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  createdAt: string;
  business: { id: string; slug: string; displayName: string };
}

interface OwnedEntityLite {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  verificationStatus?: string;
  verificationLevel?: string;
  ratingAverage?: string | number | null;
  ratingCount?: number;
}

interface BusinessSummary {
  totalReviews: number;
  averageRating: number;
  totalVisits: number;
  widgetImpressions: number;
  responseRate: number;
}

interface BusinessAnalytics {
  reviews: {
    total: number;
    average: number;
    dailyTrend: Array<{ date: string; count: number }>;
    flaggedCount: number;
  };
  visits: {
    total: number;
    uniqueIps: number;
    dailyVisits: Array<{ date: string; count: number }>;
  };
  summary: BusinessSummary;
}

interface VerificationApplication {
  id: string;
  status: string;
  level: string;
  type: string;
  appliedAt: string;
  estimatedReviewAt?: string | null;
}

const ACTIVE_VERIFICATION_STATUSES = new Set([
  'PENDING',
  'DOCUMENTS_UPLOADED',
  'AUTO_CHECKING',
  'HUMAN_REVIEW_REQUIRED',
]);

function verificationLabel(status: string | null | undefined): string {
  switch (status) {
    case 'APPROVED':
      return 'Verified';
    case 'PENDING':
      return 'Application submitted';
    case 'DOCUMENTS_UPLOADED':
      return 'Documents under review';
    case 'AUTO_CHECKING':
      return 'Automated checks in progress';
    case 'HUMAN_REVIEW_REQUIRED':
      return 'Manual review in progress';
    case 'REJECTED':
      return 'Application rejected';
    case 'EXPIRED':
      return 'Application expired';
    case 'NOT_STARTED':
    default:
      return 'Not started';
  }
}

function verificationTone(status: string | null | undefined): 'success' | 'primary' | 'secondary' | 'muted' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
    case 'EXPIRED':
      return 'muted';
    case 'NOT_STARTED':
      return 'muted';
    default:
      return 'primary';
  }
}

function verificationCtaHref(status: string | null | undefined, businessId: string | null | undefined): string {
  if (!businessId) return '/dashboard/register';
  if (status === 'APPROVED') return `/business/verification`;
  if (status === 'NOT_STARTED') return `/business/verification`;
  return `/business/verification`;
}

export function DashboardOverviewContent() {
  const session = useSession((s) => s.session);

  // 1. /users/me — display name, avatar.
  const { data: me, isLoading: meLoading, isError: meError } = useQuery({
    queryKey: qk.users.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: MeUser }>('/users/me');
      return res.data.data;
    },
  });

  // 2. /reviews/me — reviews I've authored.
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: qk.reviews.owner(1, 5, { sortBy: 'createdAt', sortOrder: 'desc' }),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: UserReview[] }>(
        '/reviews/me',
      );
      return res.data.data;
    },
  });

  // 3. /businesses/me/profile — owned business summary (404 → null).
  const { data: business = null } = useQuery({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: true; data: OwnedEntityLite }>(
          '/businesses/me/profile',
        );
        return res.data.data;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  });

  // 4. /professionals/me/profile — owned professional summary (404 → null).
  const { data: professional = null } = useQuery({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: true; data: OwnedEntityLite }>(
          '/professionals/me/profile',
        );
        return res.data.data;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  });

  // 5. Business-only: analytics (gated behind `business` truthy).
  const { data: analytics = null, isLoading: analyticsLoading } = useQuery({
    queryKey: qk.analytics.business('30d'),
    enabled: Boolean(business?.id),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: BusinessAnalytics }>(
        '/businesses/me/analytics?range=30d',
      );
      return res.data.data;
    },
  });

  // 6. Business-only: pending verification application.
  const { data: verificationApps = [] } = useQuery({
    queryKey: qk.verification.applications(business?.id ?? ''),
    enabled: Boolean(business?.id) && business?.verificationStatus !== 'APPROVED',
    queryFn: async () => {
      const res = await apiClient.get<{
        success: true;
        data: VerificationApplication[];
      }>(`/businesses/${business!.id}/verification/applications`);
      return res.data.data;
    },
  });

  // --- Derived state --------------------------------------------------

  const isBusinessOwner = Boolean(business?.id);
  const totalReviewsWritten = reviews.length;
  const recentReviews = reviews.slice(0, 5);

  const greetingName =
    me?.firstName?.trim() ||
    session?.user.firstName?.trim() ||
    session?.user.email?.split('@')[0] ||
    null;

  const completion = useProfileCompletion({
    user: me,
    business,
    professional,
  });

  // --- Loading skeleton ----------------------------------------------

  if (meLoading && !me) {
    return <OverviewSkeleton />;
  }

  // --- Hard error ----------------------------------------------------

  if (meError && !me) {
    return (
      <div className="space-y-6">
        <FriendlyError
          kind="kpis"
          title="We couldn't load your dashboard"
          body="Please refresh the page in a moment. If the problem persists, sign in again."
        />
      </div>
    );
  }

  // --- Stat cards (role-adaptive) ------------------------------------

  const statCards = isBusinessOwner
    ? buildBusinessStatCards({ business, analytics, analyticsLoading })
    : buildCustomerStatCards({
        reviewsWritten: totalReviewsWritten,
        completionPercent: completion.percent,
      });

  // --- Quick actions (role-adaptive) ---------------------------------

  const quickActions = buildQuickActions({ business, professional, hasReviews: totalReviewsWritten > 0 });

  // --- Verification status for the analytics row ---------------------

  const verificationStatus: string | null | undefined = (() => {
    if (isBusinessOwner) {
      // Prefer the live application status if one is in flight.
      const inFlight = verificationApps.find((a) =>
        ACTIVE_VERIFICATION_STATUSES.has(a.status),
      );
      if (inFlight) return inFlight.status;
      return business?.verificationStatus ?? 'NOT_STARTED';
    }
    return null;
  })();

  const pendingApp = isBusinessOwner
    ? verificationApps.find((a) => ACTIVE_VERIFICATION_STATUSES.has(a.status))
    : undefined;

  return (
    <MotionStagger className="space-y-6">
      <Hero
        firstName={greetingName}
        email={me?.email}
        business={business}
        professional={professional}
      />

      <StatCardGrid>
        {statCards.map((card, i) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            helper={card.helper}
            tone={card.tone}
            delay={0.04 * i}
          />
        ))}
      </StatCardGrid>

      <ProfileCompletionCard
        percent={completion.percent}
        items={completion.items}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentReviewsCard
          reviews={recentReviews}
          isLoading={reviewsLoading}
          className="lg:col-span-2"
        />

        <SectionCard className="h-full p-6">
          <SectionCardHeader
            eyebrow="Shortcuts"
            title="Quick actions"
            description="The most common tasks, one tap away."
          />
          <div className="mt-5">
            <QuickActions actions={quickActions} className="grid-cols-1 lg:grid-cols-1" />
          </div>
        </SectionCard>
      </div>

      {isBusinessOwner && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard className="p-6">
            <SectionCardHeader
              eyebrow="Performance"
              title="Reviews trend (30 days)"
              description="New reviews received per day across your business."
            />
            <div className="mt-5">
              {analyticsLoading && !analytics ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : (
                <LineChart
                  data={analytics?.reviews.dailyTrend ?? []}
                  color="#1a56db"
                  label="Reviews per day"
                />
              )}
            </div>
            {analytics && (
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center">
                <MiniMetric
                  label="Visits"
                  value={analytics.summary.totalVisits.toLocaleString()}
                />
                <MiniMetric
                  label="Widget impressions"
                  value={analytics.summary.widgetImpressions.toLocaleString()}
                />
                <MiniMetric
                  label="Response rate"
                  value={`${analytics.summary.responseRate}%`}
                />
              </div>
            )}
            <div className="mt-4 border-t border-border/60 pt-4">
              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                <Link href={'/business/dashboard/analytics' as never}>
                  View full analytics →
                </Link>
              </Button>
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <SectionCardHeader
              eyebrow="Trust"
              title="Verification status"
              description="Where you are in the Credible verification journey."
            />

            <div className="mt-5 flex items-start gap-4">
              <IconTile
                icon={<ShieldCheck className="h-5 w-5" />}
                tone={verificationTone(verificationStatus)}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground">
                  {verificationLabel(verificationStatus)}
                </p>
                {pendingApp ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {verificationDescriptionFor(pendingApp)}
                  </p>
                ) : business?.verificationStatus === 'APPROVED' ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your business has been verified. The badge is live on your public page.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get your business verified to display the Credible trust badge on your public page.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
              <Button
                asChild
                size="sm"
                variant={
                  business?.verificationStatus === 'APPROVED' ? 'outline' : 'default'
                }
                className="w-full sm:w-auto"
              >
                <Link
                  href={
                    verificationCtaHref(
                      business?.verificationStatus,
                      business?.id,
                    ) as never
                  }
                >
                  {business?.verificationStatus === 'APPROVED'
                    ? 'View badge'
                    : business?.verificationStatus &&
                        business.verificationStatus !== 'NOT_STARTED'
                      ? 'Continue application'
                      : 'Start verification'}
                </Link>
              </Button>
            </div>
          </SectionCard>
        </div>
      )}
    </MotionStagger>
  );
}

// --- Building blocks -------------------------------------------------

interface BusinessStatCardInput {
  business: OwnedEntityLite | null;
  analytics: BusinessAnalytics | null;
  analyticsLoading: boolean;
}

function buildBusinessStatCards({
  business,
  analytics,
  analyticsLoading,
}: BusinessStatCardInput) {
  const ratingValue = formatRating(business?.ratingAverage);
  const ratingCount = business?.ratingCount ?? 0;
  const totalReviews = analytics?.summary.totalReviews ?? null;
  const totalVisits = analytics?.summary.totalVisits ?? null;
  const responseRate = analytics ? `${analytics.summary.responseRate}%` : null;

  return [
    {
      icon: <Star className="h-4 w-4" />,
      label: 'Average rating',
      value: ratingValue,
      helper: ratingCount > 0 ? `From ${ratingCount} ${pluralize(ratingCount, 'review')}` : 'No reviews yet',
      tone: 'secondary' as const,
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Reviews received',
      value: analyticsLoading && totalReviews === null ? '—' : (totalReviews ?? 0).toLocaleString(),
      helper: analyticsLoading ? 'Loading 30-day analytics…' : 'Last 30 days',
      tone: 'primary' as const,
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: 'Profile views',
      value: totalVisits === null ? '—' : totalVisits.toLocaleString(),
      helper: totalVisits === null ? 'Loading…' : 'Last 30 days',
      tone: 'muted' as const,
    },
    {
      icon: <LineChartIcon className="h-4 w-4" />,
      label: 'Response rate',
      value: responseRate ?? (analyticsLoading ? '—' : '—'),
      helper: responseRate === null ? 'Loading…' : 'Across all reviews',
      tone: 'success' as const,
    },
  ];
}

interface CustomerStatCardInput {
  reviewsWritten: number;
  completionPercent: number;
}

function buildCustomerStatCards({
  reviewsWritten,
  completionPercent,
}: Omit<CustomerStatCardInput, 'ownedCount'>) {
  return [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Reviews written',
      value: reviewsWritten.toLocaleString(),
      helper:
        reviewsWritten === 0
          ? 'Find a business to get started'
          : `${reviewsWritten} ${pluralize(reviewsWritten, 'review')} total`,
      tone: 'primary' as const,
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: 'Profile strength',
      value: `${completionPercent}%`,
      helper:
        completionPercent === 100
          ? 'All set — looking great'
          : 'A few details away from complete',
      tone: 'primary' as const,
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      label: 'Account status',
      value: 'Active',
      helper: 'Your account is in good standing',
      tone: 'success' as const,
    },
  ];
}

interface QuickActionsInput {
  business: OwnedEntityLite | null;
  professional: OwnedEntityLite | null;
  hasReviews: boolean;
}

function buildQuickActions({ business, professional }: QuickActionsInput) {
  const viewPageHref = business?.slug
    ? `/business/${business.slug}`
    : professional?.slug
      ? `/p/${professional.slug}`
      : null;

  const actions = [
    {
      href: '/search',
      title: 'Write a review',
      description: 'Share an experience',
      icon: <Search className="h-4 w-4" />,
      tone: 'primary' as const,
    },
    {
      href: '/dashboard/register',
      title: ownedCount(business, professional) > 0 ? 'Add another business' : 'Register a Business',
      description: 'Business or professional',
      icon: <PlusCircle className="h-4 w-4" />,
      tone: 'secondary' as const,
    },
    {
      href: '/dashboard/profile',
      title: 'Edit profile',
      description: 'Update your details',
      icon: <PencilLine className="h-4 w-4" />,
      tone: 'muted' as const,
    },
    {
      href: '/forgot-password',
      title: 'Change password',
      description: 'Update credentials',
      icon: <KeyRound className="h-4 w-4" />,
      tone: 'muted' as const,
    },
  ] as const;

  if (viewPageHref) {
    return [
      {
        href: viewPageHref,
        title: 'View your page',
        description: 'See how it looks to customers',
        icon: <Eye className="h-4 w-4" />,
        tone: 'primary' as const,
      },
      ...actions,
    ];
  }

  return [...actions];
}

function ownedCount(
  business: OwnedEntityLite | null,
  professional: OwnedEntityLite | null,
): number {
  return (business ? 1 : 0) + (professional ? 1 : 0);
}

function verificationDescriptionFor(app: VerificationApplication): string {
  const date = app.estimatedReviewAt
    ? formatRelative(app.estimatedReviewAt)
    : 'soon';
  return `Your ${app.level.toLowerCase()} ${app.type.toLowerCase()} application is in progress — estimated decision ${date}.`;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

// --- Loading skeleton -------------------------------------------------

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
