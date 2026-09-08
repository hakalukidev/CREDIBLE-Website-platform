'use client';

import Link from 'next/link';
import { ShieldCheck, Award, MessageSquare, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/store/session';
import { usePublicPlans } from '@/features/home/use-public-plans';
import { PlansSection } from '@/features/home/plans-section';
import { BUSINESS_FEATURES } from '@/features/home/plan-card';
import { MotionSection, MotionCardReveal } from '@/components/ui/motion-primitives';

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

  // Role-aware CTA: signed-in BUSINESS/ADMIN go to their dashboard;
  // everyone else lands on the registration form (via /register?next=…
  // for unauthenticated visitors, so signup drops them straight here).
  const dashboardHref =
    session?.user.role === 'BUSINESS'
      ? '/business/dashboard'
      : session?.user.role === 'ADMIN'
        ? '/admin'
        : session
          ? '/dashboard/register?type=business'
          : '/register?next=/dashboard/register%3Ftype%3Dbusiness';

  // Pick a plan to highlight (typically the most popular paid tier).
  const highlightedPlan =
    plans?.find((p) => p.code === 'BASIC' && p.hasBadge) ??
    plans?.find((p) => p.hasBadge && p.code !== 'FREE') ??
    plans?.[1] ??
    null;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-8%] h-96 w-96 rounded-full bg-gradient-to-br from-brand-500/20 to-transparent blur-3xl" />
          <div className="absolute bottom-[-30%] left-[10%] h-80 w-80 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-3xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60%_60%_at_30%_20%,black,transparent)]" />

        <div className="container-wide relative py-20 md:py-24">
          <Badge
            variant="outline"
            className="border-secondary/25 bg-secondary/10 px-3 py-1 text-secondary"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            For Business
          </Badge>
          <h1 className="mt-5 max-w-3xl font-display text-display font-bold tracking-tight">
            Build trust.{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-600 to-primary">
              Earn the badge.
            </span>
          </h1>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
            Credible helps you earn public trust with a verified profile, prestigious badges, and a
            frictionless review experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gradient-primary">
              <Link href={dashboardHref}>
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <MotionSection className="container-wide py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, title, body }, idx) => (
            <MotionCardReveal key={title} style={{ transitionDelay: `${idx * 40}ms` }}>
              <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-shadow duration-300 group-hover:shadow-glow">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            </MotionCardReveal>
          ))}
        </div>
      </MotionSection>

      <MotionSection id="pricing" className="container-wide pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-8 shadow-card backdrop-blur-sm md:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          />
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="mr-1 h-3 w-3" aria-hidden />
              Pricing
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Pick the tier that fits your business — change or cancel anytime.
            </p>
          </div>

          <div className="mt-10">
            <PlansSection
              plans={plans}
              isLoading={isLoading}
              isError={isError}
              highlightedPlan={highlightedPlan}
              ctaHref={dashboardHref}
              features={BUSINESS_FEATURES}
              gridCols="gap-5 md:grid-cols-2 lg:grid-cols-4"
              skeletonCount={4}
            />
          </div>
        </div>
      </MotionSection>
    </>
  );
}