'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonStack } from '@/components/dashboard/primitives/skeleton-stack';
import { MotionFadeUp } from '@/components/ui/motion-primitives';
import { duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

export type AccountTab = 'reviews' | 'profile' | 'business';

const TAB_VALUES: AccountTab[] = ['reviews', 'profile', 'business'];

function isTab(s: string | null | undefined): s is AccountTab {
  return !!s && (TAB_VALUES as string[]).includes(s);
}

interface AccountShellProps {
  /** Tab to show when the URL has no `?tab=` param. Defaults to "reviews". */
  defaultTab?: AccountTab;
}

export function AccountShell({ defaultTab = 'reviews' }: AccountShellProps) {
  // Next 16 forces useSearchParams consumers into a Suspense boundary.
  return (
    <Suspense fallback={<AccountShellFallback />}>
      <AccountShellInner defaultTab={defaultTab} />
    </Suspense>
  );
}

function AccountShellFallback() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <SkeletonStack className="mt-8" count={2} height="h-24" />
    </div>
  );
}

function AccountShellInner({ defaultTab = 'reviews' }: AccountShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // URL is the single source of truth — no separate useState, so we
  // can't drift out of sync with deep-links or back/forward navigation.
  const active: AccountTab = (() => {
    const fromUrl = searchParams.get('tab');
    return isTab(fromUrl) ? fromUrl : defaultTab;
  })();

  function handleChange(next: string) {
    if (!isTab(next)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultTab) params.delete('tab');
    else params.set('tab', next);
    const query = params.toString();
    router.replace(`/account${query ? `?${query}` : ''}` as never, {
      scroll: false,
    });
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <MotionFadeUp>
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your account
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Account
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage the reviews you've written, your personal profile, and the
            business or professional page you represent on Credible.
          </p>
        </header>
      </MotionFadeUp>

      <div>
        <Tabs value={active} onValueChange={handleChange} className="space-y-6">
          {/* Horizontal scroll on small screens so the third tab never
              wraps awkwardly. */}
          <div className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList
              className={cn(
                'inline-flex h-auto w-auto min-w-full justify-start gap-1 rounded-lg bg-muted/60 p-1',
                'sm:gap-2 sm:p-1.5',
              )}
            >
              <AccountTabTrigger value="reviews" label="Your reviews" />
              <AccountTabTrigger value="profile" label="Profile" />
              <AccountTabTrigger
                value="business"
                label="Business / Professional page"
              />
            </TabsList>
          </div>

          {/* Radix Tabs unmount inactive panels; the dynamic import means
              the JS for each tab is only loaded on first activation. */}
          <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
            <PanelTransition tabKey={active}>
              <ReviewsTabContent />
            </PanelTransition>
          </TabsContent>

          <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
            <PanelTransition tabKey={active}>
              <ProfileTabContent />
            </PanelTransition>
          </TabsContent>

          <TabsContent value="business" className="mt-0 focus-visible:outline-none">
            <PanelTransition tabKey={active}>
              <BusinessTabContent />
            </PanelTransition>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AccountTabTriggerProps {
  value: AccountTab;
  label: string;
}

function AccountTabTrigger({ value, label }: AccountTabTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium',
        'text-muted-foreground transition-colors',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'hover:text-foreground',
        'sm:px-4',
      )}
    >
      {label}
    </TabsTrigger>
  );
}

// ssr:false is required because every tab content uses client-only
// hooks (useSession, useQuery, useRouter). Without it, direct visits
// to /account?tab=profile would render an empty shell on the server
// before hydrating, which shows up as a flash.
const ReviewsTabContent = dynamic(
  () => import('@/app/account/reviews/page-content').then((m) => m.AccountReviewsContent),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const ProfileTabContent = dynamic(
  () => import('@/app/account/profile/page-content').then((m) => m.AccountProfileContent),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const BusinessTabContent = dynamic(
  () => import('@/app/account/business/page-content').then((m) => m.AccountBusinessContent),
  { ssr: false, loading: () => <TabSkeleton /> },
);

function TabSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-24 rounded-lg" />
      ))}
    </div>
  );
}

function PanelTransition({
  tabKey,
  children,
}: {
  tabKey: AccountTab;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.fast, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
