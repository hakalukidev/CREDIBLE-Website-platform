'use client';

import Link from 'next/link';
import { ShieldCheck, Award, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/store/session';
import { usePublicPlans } from '@/features/home/use-public-plans';
import { PlansSection } from '@/features/home/plans-section';
import { BUSINESS_FEATURES } from '@/features/home/plan-card';

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: 'Human-reviewed verification',
    body: 'No bots — every application is reviewed by our team.',
  },
  {
    icon: Award,
    title: 'Prestigious badges',
    body: 'Downloadable, shareable, verifiable badge assets.',
  },
  {
    icon: MessageSquare,
    title: 'Two-way reviews',
    body: 'Publicly respond to reviews and resolve concerns.',
  },
  {
    icon: BarChart3,
    title: 'Transparent analytics',
    body: 'Track trust signals and review trends over time.',
  },
];

export default function ForBusinessPage() {
  const session = useSession((s) => s.session);
  const { plans, isLoading, isError } = usePublicPlans();

  // Pick the dashboard route based on session role.
  const dashboardHref =
    session?.user.role === 'BUSINESS'
      ? '/business/dashboard'
      : session?.user.role === 'ADMIN'
        ? '/admin'
        : '/register-business';

  // Pick a plan to highlight (typically the most popular paid tier).
  const highlightedPlan =
    plans?.find((p) => p.code === 'BASIC' && p.hasBadge) ??
    plans?.find((p) => p.hasBadge && p.code !== 'FREE') ??
    plans?.[1] ??
    null;

  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">For Business</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Build trust. Earn the badge.
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Credible helps you earn public trust with a verified profile, prestigious badges, and a
            frictionless review experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={dashboardHref}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#pricing">See pricing</Link>
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

      <section id="pricing" className="container-wide py-12">
        <h2 className="text-2xl font-bold tracking-tight">Simple, transparent pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the tier that fits your business — change or cancel anytime.
        </p>

        <div className="mt-6">
          <PlansSection
            plans={plans}
            isLoading={isLoading}
            isError={isError}
            highlightedPlan={highlightedPlan}
            ctaHref={dashboardHref}
            features={BUSINESS_FEATURES}
            gridCols="md:grid-cols-2 lg:grid-cols-4"
            skeletonCount={4}
          />
        </div>
      </section>
    </>
  );
}