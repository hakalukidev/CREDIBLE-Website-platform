'use client';

import Link from 'next/link';
import { ShieldCheck, Award, UserSearch, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/store/session';
import { usePublicPlans } from '@/features/home/use-public-plans';
import { PlansSection } from '@/features/home/plans-section';
import { PROFESSIONAL_FEATURES } from '@/features/home/plan-card';

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: 'Verified professional profile',
    body: 'Stand out with a Credible Verified badge — reviewed by humans, not bots.',
  },
  {
    icon: Award,
    title: 'Portable credentials',
    body: 'Share a single link to your verified profile, badge, and reviews across the web.',
  },
  {
    icon: UserSearch,
    title: 'Discovered by the right clients',
    body: 'Get found when customers search for your profession and city in our directory.',
  },
  {
    icon: BarChart3,
    title: 'Reputation insights',
    body: 'See how your trust score evolves over time and respond to reviews in one place.',
  },
];

export default function ForProfessionalsPage() {
  const session = useSession((s) => s.session);
  const { plans, isLoading, isError } = usePublicPlans();

  // Pick the dashboard route depending on role.
  const dashboardHref =
    session?.user.role === 'PROFESSIONAL'
      ? '/professional/dashboard'
      : session?.user.role === 'BUSINESS'
        ? '/business/dashboard'
        : '/register';

  // For the price card we pick the first plan that has a badge or, failing
  // that, any paid plan.
  const featuredPlan =
    plans?.find((p) => p.hasBadge && p.code !== 'FREE') ??
    plans?.find((p) => p.code !== 'FREE') ??
    null;

  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            For Professionals
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your expertise. Verified.
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Credible helps independent professionals — doctors, lawyers, freelancers, consultants —
            build public trust with a verified profile, badge, and reviews.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={dashboardHref}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/professionals/search">Browse professionals</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container-wide pb-16">
        <h2 className="text-2xl font-bold tracking-tight">A simple path to get verified</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plans are managed by your team account. Pick the tier that fits your practice.
        </p>

        <div className="mt-6">
          <PlansSection
            plans={plans}
            isLoading={isLoading}
            isError={isError}
            highlightedPlan={featuredPlan}
            ctaHref={dashboardHref}
            features={PROFESSIONAL_FEATURES}
            gridCols="md:grid-cols-3"
            skeletonCount={3}
          />
        </div>
      </section>
    </>
  );
}