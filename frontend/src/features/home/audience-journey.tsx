'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquareQuote, BadgeCheck, Code2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MotionSection } from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';

export type Audience = 'business' | 'professional';

interface AudienceJourneyProps {
  audience: Audience;
}

const STEPS = [
  {
    icon: MessageSquareQuote,
    eyebrow: 'Step 1',
    title: 'Get Reviews',
    body: 'Get verified reviews from real customers with OTP-verified accounts.',
  },
  {
    icon: BadgeCheck,
    eyebrow: 'Step 2',
    title: 'Get Certified Badge',
    body: 'Apply for the Credible Certified badge. Human-reviewed, download-ready, and shareable.',
  },
  {
    icon: Code2,
    eyebrow: 'Step 3',
    title: 'Use API',
    body: 'Integrate Credible reviews, badges, and trust scores into your own website via our public API.',
  },
] as const;

const COPY: Record<Audience, {
  eyebrow: string;
  headline: string;
  highlight: string;
  subtitle: string;
  awardsTitle: string;
  awardsBody: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
}> = {
  business: {
    eyebrow: 'For Business',
    headline: 'Earn trust. Get recognised.',
    highlight: 'Get Certified.',
    subtitle:
      'From verified reviews to a Certified badge, Credible helps real businesses stand out — clearly, publicly, and on their own terms.',
    awardsTitle: 'Get Certified. Be Recognised.',
    awardsBody:
      'Every Certified business is automatically eligible for the annual Credible Awards — Top 3 in every category and subcategory. Winners receive an official Award badge and certificate.',
    ctaPrimary: 'Get your business certified',
    ctaPrimaryHref: '/profile',
    ctaSecondary: 'Talk to the team',
    ctaSecondaryHref: '/contact',
  },
  professional: {
    eyebrow: 'For Professionals',
    headline: 'Build a profile that proves it.',
    highlight: 'Get Certified.',
    subtitle:
      'Credible helps independent professionals stand behind their work with verified reviews, a Certified badge, and public trust signals.',
    awardsTitle: 'Get Certified. Be Recognised.',
    awardsBody:
      'Every Certified professional is automatically eligible for the annual Credible Awards — Top 3 in every category and subcategory. Winners receive an official Award badge and certificate.',
    ctaPrimary: 'Get your profile certified',
    ctaPrimaryHref: '/profile',
    ctaSecondary: 'Browse professionals',
    ctaSecondaryHref: '/professionals/search',
  },
};

function StepCard({ icon: Icon, eyebrow, title, body, idx }: {
  icon: typeof MessageSquareQuote;
  eyebrow: string;
  title: string;
  body: string;
  idx: number;
}) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      className="group relative h-full rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-brand-100/40 text-primary ring-1 ring-primary/15 transition-shadow group-hover:shadow-glow">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="font-display text-xs font-bold tabular-nums tracking-wider text-muted-foreground">
          {eyebrow}
        </span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {idx < STEPS.length - 1 && (
        <ArrowRight
          aria-hidden
          className="absolute right-4 top-4 hidden h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary lg:block"
        />
      )}
    </motion.li>
  );
}

export function AudienceJourney({ audience }: AudienceJourneyProps) {
  const copy = COPY[audience];
  const id = React.useId();

  return (
    <MotionSection
      className={cn(
        'relative overflow-hidden border-y border-border/60',
        audience === 'professional' ? 'bg-gradient-to-b from-background to-success/[0.03]' : 'bg-gradient-to-b from-background to-primary/[0.03]',
      )}
      id={`audience-${audience}-${id}`}
    >
      <div className="container-wide py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={cn(
              'mb-2.5 text-xs font-semibold uppercase tracking-[0.18em]',
              audience === 'professional' ? 'text-success' : 'text-primary',
            )}
          >
            {copy.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {copy.headline}{' '}
            <span className="bg-gradient-to-r from-primary via-brand-500 to-gold-600 bg-clip-text text-transparent">
              {copy.highlight}
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.subtitle}
          </p>
        </div>

        {/* Step journey */}
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {STEPS.map((step, idx) => (
            <StepCard key={step.title} {...step} idx={idx} />
          ))}
        </motion.ol>

        {/* Awards block */}
        <div className="mt-14 grid items-center gap-8 rounded-3xl border border-gold-200/80 bg-gold-grad p-6 shadow-card md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-700">
              <Trophy className="h-3 w-3" aria-hidden />
              Credible Awards
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {copy.awardsTitle}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base">
              {copy.awardsBody}
            </p>
          </div>
          <Button asChild size="lg" className="group h-12 rounded-full bg-gold px-6 text-gold-foreground shadow-ring-gold hover:bg-gold/90">
            <Link href={'/awards' as never}>
              See the awards
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="group h-12 rounded-full px-7 text-[15px] shadow-sm">
            <Link href={copy.ctaPrimaryHref as never}>
              {copy.ctaPrimary}
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
            <Link href={copy.ctaSecondaryHref as never}>{copy.ctaSecondary}</Link>
          </Button>
        </div>
      </div>
    </MotionSection>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card features grid (shared between business + professional)              */
/* -------------------------------------------------------------------------- */

const FEATURES = {
  business: [
    { title: 'Human-reviewed verification', body: 'No bots — every application is reviewed by our team.' },
    { title: 'Prestigious badges', body: 'Downloadable, shareable, verifiable badge assets.' },
    { title: 'Two-way reviews', body: 'Publicly respond to reviews and resolve concerns.' },
    { title: 'Transparent analytics', body: 'Track trust signals and review trends over time.' },
  ],
  professional: [
    { title: 'Human-reviewed verification', body: 'No bots — every application is reviewed by our team.' },
    { title: 'Prestigious badges', body: 'Downloadable, shareable, verifiable badge assets.' },
    { title: 'Two-way reviews', body: 'Publicly respond to reviews and resolve concerns.' },
    { title: 'Reputation insights', body: 'See how your trust score evolves over time.' },
  ],
} as const;

export function AudienceFeatureGrid({ audience }: AudienceJourneyProps) {
  const items = FEATURES[audience];
  return (
    <MotionSection className="border-y border-border/60 bg-gradient-to-b from-muted/20 to-background">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
            >
              <span className="inline-flex h-3 w-8 rounded-full bg-gradient-to-r from-primary to-gold-500" aria-hidden />
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
