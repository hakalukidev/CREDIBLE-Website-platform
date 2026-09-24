'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Award, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/store/session';
import {
  AudienceJourney,
  AudienceFeatureGrid,
} from '@/features/home/audience-journey';
import { CertifiedHowItWorks } from '@/features/home/certified-how-it-works';
import { WriteReviewCTA } from '@/features/home/write-review-cta';
import { PricingSection } from '@/features/marketing/pricing-section';

const VALUE_PROPS = [
  { icon: ShieldCheck, title: 'Human-reviewed', body: 'No bots. Real eyes on every application.' },
  { icon: Award, title: 'Prestigious badges', body: 'Downloadable, shareable, display-ready.' },
  { icon: MessageSquare, title: 'Two-way reviews', body: 'Respond publicly to every review.' },
  { icon: BarChart3, title: 'Transparent analytics', body: 'Track trust signals over time.' },
];

export default function ForBusinessPage() {
  const session = useSession((s) => s.session);

  // Page creation now lives inside the user's own profile (the "Register
  // a Business" tab) — unauthenticated visitors are sent through the
  // register flow with a return path.
  const ctaHref = session?.user
    ? `/profile/${session.user.username ?? session.user.id}`
    : '/register?next=/profile';

  const dashboardHref =
    session?.user.role === 'BUSINESS'
      ? '/business/dashboard'
      : session?.user.role === 'ADMIN'
        ? '/admin'
        : '/business/dashboard';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-light-hero">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-8%] h-96 w-96 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
          <div className="absolute bottom-[-30%] left-[10%] h-80 w-80 rounded-full bg-gradient-to-tr from-gold/10 to-transparent blur-3xl" />
        </div>

        <div className="container-wide relative grid items-center gap-10 py-16 md:grid-cols-[1.05fr_1fr] md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              For Business
            </span>
            <h1 className="mt-5 font-display text-[clamp(2rem,1.4rem+3vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-foreground">
              Build trust.{' '}
              <span className="bg-gradient-to-r from-primary via-brand-500 to-gold-600 bg-clip-text text-transparent">
                Earn the badge.
              </span>
            </h1>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
              A verified profile, a prestigious badge, a frictionless review experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group h-11 rounded-full px-6 shadow-sm">
                <Link href={ctaHref as never}>
                  Get Credible Certified
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full">
                <Link href={dashboardHref as never}>Open dashboard</Link>
              </Button>
            </div>
          </div>

          {/* Decorative credential card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative rounded-3xl border border-border bg-card p-6 shadow-lift">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-100 to-gold-50 text-gold-700 ring-1 ring-gold-300/60">
                  <Award className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">Credible Certified</p>
                  <p className="text-[11px] text-muted-foreground">Human-reviewed badge</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-2 w-full rounded-full bg-muted" />
                <div className="h-2 w-5/6 rounded-full bg-muted/70" />
                <div className="h-2 w-2/3 rounded-full bg-muted/50" />
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-xs font-medium text-success">
                <span>Documents verified</span>
                <span aria-hidden>✓</span>
              </div>
            </div>
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-gold-100 blur-2xl"
            />
          </div>
        </div>
      </section>

      {/* 3-step journey */}
      <AudienceJourney audience="business" />

      {/* Card features */}
      <AudienceFeatureGrid audience="business" />

      {/* Pricing — admin-managed via /admin/billing/plans */}
      <PricingSection
        audience="business"
        eyebrow="Pricing"
        headline="One simple annual fee. Verified trust, all year long."
        subtitle="Pick the plan that matches how you grow your customer base. Every plan includes a public profile, verified reviews, and the path to a Credible Certified badge."
      />

      {/* How certified badge works */}
      <CertifiedHowItWorks />

      {/* Value props re-stated visually with the new copy */}
      <section className="border-y border-border/60 bg-gradient-to-b from-muted/20 to-background">
        <div className="container-wide py-12 md:py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-brand-100/40 text-primary ring-1 ring-primary/15 transition-shadow group-hover:shadow-glow">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Write a review — alternate variant */}
      <WriteReviewCTA variant="business" />

      {/* Closing CTA */}
      <section className="container-wide pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-card md:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to get Certified?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Most applications are assessed within a few business days. $19/year, renewable annually.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="group h-12 rounded-full px-7 text-[15px] shadow-sm">
              <Link href={ctaHref as never}>
                Start your application
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-gold px-7 text-gold-foreground shadow-ring-gold hover:bg-gold/90"
            >
              <Link href={'/awards' as never}>See the Awards</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
