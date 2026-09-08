'use client';

import Link from 'next/link';
import { ShieldCheck, Award, UserSearch, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/store/session';
import { usePublicPlans } from '@/features/home/use-public-plans';
import { PlansSection } from '@/features/home/plans-section';
import { PROFESSIONAL_FEATURES } from '@/features/home/plan-card';
import { MotionSection, MotionCardReveal } from '@/components/ui/motion-primitives';

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

  // Role-aware CTA: signed-in PROFESSIONAL/BUSINESS go to their
  // dashboard; everyone else lands on the registration form (via
  // /register?next=… for unauthenticated visitors).
  const dashboardHref =
    session?.user.role === 'PROFESSIONAL'
      ? '/professional/dashboard'
      : session?.user.role === 'BUSINESS'
        ? '/business/dashboard'
        : session
          ? '/dashboard/register?type=professional'
          : '/register?next=/dashboard/register%3Ftype%3Dprofessional';

  // For the price card we pick the first plan that has a badge or, failing
  // that, any paid plan.
  const featuredPlan =
    plans?.find((p) => p.hasBadge && p.code !== 'FREE') ??
    plans?.find((p) => p.code !== 'FREE') ??
    null;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[20%] h-96 w-96 rounded-full bg-gradient-to-br from-brand-500/20 to-transparent blur-3xl" />
          <div className="absolute bottom-[-30%] right-[-6%] h-80 w-80 rounded-full bg-gradient-to-bl from-success/15 to-transparent blur-3xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60%_60%_at_70%_20%,black,transparent)]" />

        <div className="container-wide relative py-20 md:py-24">
          <Badge
            variant="outline"
            className="border-success/25 bg-success/10 px-3 py-1 text-success"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            For Professionals
          </Badge>
          <h1 className="mt-5 max-w-3xl font-display text-display font-bold tracking-tight">
            Your expertise.{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-600 to-primary">
              Verified.
            </span>
          </h1>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
            Credible helps independent professionals — doctors, lawyers, freelancers, consultants —
            build public trust with a verified profile, badge, and reviews.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gradient-primary">
              <Link href={dashboardHref}>
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/professionals/search">Browse professionals</Link>
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

      <MotionSection className="container-wide pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            <Sparkles className="mr-1 h-3 w-3" aria-hidden />
            Get verified
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A simple path to get verified
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Plans are managed by your team account. Pick the tier that fits your practice.
          </p>
        </div>

        <div className="mt-10">
          <PlansSection
            plans={plans}
            isLoading={isLoading}
            isError={isError}
            highlightedPlan={featuredPlan}
            ctaHref={dashboardHref}
            features={PROFESSIONAL_FEATURES}
            gridCols="gap-5 md:grid-cols-3"
            skeletonCount={3}
          />
        </div>
      </MotionSection>
    </>
  );
}