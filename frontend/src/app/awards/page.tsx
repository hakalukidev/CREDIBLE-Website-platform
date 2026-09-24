import * as React from 'react';
import Link from 'next/link';
import {
  Trophy,
  ArrowRight,
  Award as AwardIcon,
  Sparkles,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageMetadata } from '@/lib/seo/metadata';
import { AwardsDirectory } from '@/features/awards/awards-directory';

export const metadata = pageMetadata({
  title: 'Awards — Credible Awards: Recognising the Best. Every Year.',
  description:
    'Every Credible Certified business and professional is automatically eligible for the annual Credible Awards. Top 3 in every category and subcategory.',
  path: '/awards',
});

const AWARD_TYPES = [
  {
    icon: Crown,
    title: 'Best of the Year',
    body: 'Highest cumulative trust score across an entire year.',
  },
  {
    icon: Trophy,
    title: 'Top Rated',
    body: 'Outstanding verified rating and review consistency.',
  },
  {
    icon: AwardIcon,
    title: 'Top Rated',
    body: 'Recognised for sustained excellence in their category.',
  },
  {
    icon: Sparkles,
    title: 'Top Rated',
    body: 'Marked out by reviewers for going above and beyond.',
  },
];

const WINNER_BENEFITS = [
  'An official Credible Award badge displayed on your profile.',
  'A printable certificate you can frame or share.',
  'Embeddable badge assets for your website and email signature.',
  'Permanent listing in the public Credible Awards directory.',
];

const WINNERS = [
  { id: '1', category: 'Banking', name: 'Zenith Bank', year: 2026, description: 'Top customer-trust score across retail banking.', emoji: '🏦', hue: 'from-primary/15 to-brand-100' },
  { id: '2', category: 'Banking', name: 'Atlas Federal', year: 2026, description: 'Recognised for transparent fee disclosures.', emoji: '🪙', hue: 'from-gold-200 to-gold-50' },
  { id: '3', category: 'Banking', name: 'Coral Trust', year: 2025, description: 'Most improved OTP-verified rating in 2025.', emoji: '🌊', hue: 'from-brand-200/60 to-primary/10' },
  { id: '4', category: 'Technology', name: 'Helix Cloud', year: 2026, description: 'Highest verified rating across cloud & SaaS.', emoji: '☁️', hue: 'from-primary/10 to-gold-100' },
  { id: '5', category: 'Technology', name: 'Cobalt Systems', year: 2026, description: 'Best-in-class enterprise support experience.', emoji: '⚙️', hue: 'from-gold-200 to-primary/10' },
  { id: '6', category: 'Technology', name: 'Pixel Forge', year: 2025, description: 'Studio with the most 5-star verified reviews.', emoji: '🎨', hue: 'from-brand-200/60 to-gold-100' },
  { id: '7', category: 'Restaurants', name: 'Saffron & Stone', year: 2026, description: 'Most loved dining experience of the year.', emoji: '🍽️', hue: 'from-gold-100 to-primary/10' },
  { id: '8', category: 'Restaurants', name: 'Mela Kitchen', year: 2026, description: 'Highest OTP-verified food rating in 2026.', emoji: '🍛', hue: 'from-primary/15 to-gold-100' },
  { id: '9', category: 'Restaurants', name: 'Verde Café', year: 2025, description: 'Most welcoming hospitality in the directory.', emoji: '☕', hue: 'from-gold-200/80 to-brand-100' },
  { id: '10', category: 'Healthcare', name: 'Northbay Clinic', year: 2026, description: 'Most trusted primary-care practice.', emoji: '🩺', hue: 'from-primary/10 to-gold-100' },
  { id: '11', category: 'Healthcare', name: 'Lumen Dental', year: 2026, description: 'Best patient experience across dentistry.', emoji: '🦷', hue: 'from-gold-100 to-primary/10' },
  { id: '12', category: 'Legal', name: 'Hartwell & Co.', year: 2025, description: 'Top-rated verified legal counsel.', emoji: '⚖️', hue: 'from-primary/10 to-gold-100' },
];

function AwardMedal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id="awardsMedal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(43 96% 60%)" />
          <stop offset="100%" stopColor="hsl(35 92% 44%)" />
        </linearGradient>
      </defs>
      <path d="M22 40l-6 18 12-6 4 6 4-6 12 6-6-18" fill="hsl(35 92% 44%)" />
      <circle cx="32" cy="28" r="18" fill="url(#awardsMedal)" stroke="hsl(35 80% 24%)" strokeWidth="1.5" />
      <path d="M32 18l2.6 5.5 6 .9-4.4 4.3 1 6-5.2-2.8-5.2 2.8 1-6L23.4 24.4l6-.9z" fill="white" />
    </svg>
  );
}

export default function AwardsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gold-grad">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />

        <div className="container-wide relative py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white/80 px-3.5 py-1 text-xs font-semibold text-gold-700">
            <Trophy className="h-3 w-3" />
            Credible Awards
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(1.9rem,1.2rem+3vw,3.25rem)] font-bold leading-[1.06] tracking-tight text-foreground">
            Credible Awards{' '}
            <span className="bg-gradient-to-r from-primary via-brand-500 to-gold-600 bg-clip-text text-transparent">
              Recognising the Best. Every Year.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every Credible Certified Business and Professional is automatically eligible for the annual
            Credible Awards. Based on authentic customer reviews, ratings, and our review-integrity
            standards, we recognise the Top 3 performers in every category and subcategory.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full">
              <Link href="/browse">
                Explore certified businesses
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" className="group h-11 rounded-full bg-primary px-6 shadow-sm">
              <Link href={'/profile' as never}>
                Get Certified
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Award types */}
      <section className="border-y border-border/60 bg-gradient-to-b from-muted/20 to-background">
        <div className="container-wide py-14 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Award types
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Recognised in every category.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AWARD_TYPES.map(({ icon: Icon, title, body }) => (
              <div
                key={`${title}-${body}`}
                className="group rounded-2xl border border-gold-200/70 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-ring-gold"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-100 to-gold-50 text-gold-700 ring-1 ring-gold-300/60">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="container-wide py-14 md:py-20">
        <AwardsDirectory winners={WINNERS} />
      </section>

      {/* Winner benefits */}
      <section className="border-y border-border/60 bg-gradient-to-b from-background to-muted/20">
        <div className="container-wide py-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
                Winner benefits
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                What winners receive.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Winners receive an official Credible Award badge and certificate, displayed on their
                profile and available to showcase on their website.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="group h-11 rounded-full bg-gold px-6 text-gold-foreground shadow-ring-gold hover:bg-gold/90">
                  <Link href={'/profile' as never}>
                    Get Certified
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 rounded-full">
                  <Link href="/browse">See all winners</Link>
                </Button>
              </div>
            </div>

            <ul className="grid gap-3">
              {WINNER_BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-100 to-gold-50 text-gold-700 ring-1 ring-gold-300/60">
                    <span className="text-xs font-bold" aria-hidden>✓</span>
                  </span>
                  <p className="text-sm font-medium text-foreground">{benefit}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container-wide py-12 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-card md:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-gold-200 to-primary/10 blur-3xl"
          />
          <Trophy className="relative mx-auto h-12 w-12 text-gold-600" aria-hidden />
          <h2 className="relative mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Get Certified. Be Recognised.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Every Certified business or professional is automatically eligible. Top 3 in every
            category, every year.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="group h-12 rounded-full bg-primary px-7 text-[15px] shadow-sm">
              <Link href={'/profile' as never}>
                Get Certified
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </div>

          <AwardMedal className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 opacity-15" />
        </div>
      </section>
    </>
  );
}
