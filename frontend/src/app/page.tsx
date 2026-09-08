import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  BadgeCheck,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/layout/section-heading';
import { FeaturedBusinesses } from '@/features/home/featured-businesses';
import { HeroPreviewCard } from '@/features/home/hero-preview-card';
import { StatsStripClient } from '@/features/home/stats-strip-client';
import { MotionSection, MotionCardReveal } from '@/components/ui/motion-primitives';
import {
  organizationSchema,
  websiteSchemaWithSearchAction,
  webApplicationSchema,
} from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/static/json-ld';

const FEATURED_LIMIT = 4;

const POPULAR_CATEGORIES: Array<{ label: string; href: string }> = [
  { label: 'Restaurants', href: '/browse?category=restaurants' },
  { label: 'Legal', href: '/browse?category=legal' },
  { label: 'Health', href: '/browse?category=health' },
  { label: 'IT', href: '/browse?category=tech' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search',
    body: 'Find a business, professional, or category across Bangladesh.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Verify',
    body: 'Look for the Credible Verified or Certified badge — backed by human document review.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Decide',
    body: 'Read real reviews from real customers and make a confident choice.',
    icon: CheckCircle2,
  },
];

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: 'Verified & Certified',
    body: 'Every badge is awarded by a real human, after reviewing real documents. Never auto-approved.',
  },
  {
    icon: Star,
    title: 'Honest Reviews',
    body: 'One review per person per business. Edit within 24 hours. Public responses from businesses.',
  },
  {
    icon: Users,
    title: 'Public Trust',
    body: 'Transparent profile pages, business responses, and easy-to-share QR codes for in-store trust.',
  },
];

const TESTIMONIAL = {
  quote:
    'Since getting the Credible Verified badge, our walk-in conversions have noticeably increased — customers tell us they checked our profile before visiting.',
  author: 'Restaurant owner',
  location: 'Gulshan, Dhaka',
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchemaWithSearchAction(),
          webApplicationSchema(),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        {/* Animated aurora blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-brand-500/25 to-transparent blur-3xl animate-pulse-glow" />
          <div className="absolute top-1/3 left-[-8%] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-secondary/20 to-transparent blur-3xl animate-pulse-glow [animation-delay:-2s]" />
          <div className="absolute bottom-[-20%] left-1/3 h-[360px] w-[360px] rounded-full bg-gradient-to-bl from-success/15 to-transparent blur-3xl animate-pulse-glow [animation-delay:-4s]" />
        </div>
        {/* Subtle grid overlay */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

        <div className="container-wide relative grid items-center gap-14 py-10 md:py-14 md:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              User&apos;s trust layer
            </Badge>

            <h1 className="mt-6 font-display text-display font-bold text-foreground">
              Find verified{' '}
              <span className="text-gradient bg-gradient-to-r from-brand-600 via-primary to-brand-500 anim-gradient animate-gradient-shift">
                businesses.
              </span>
            </h1>

            <p className="mt-6 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
              Credible helps you discover, review, and verify businesses and
              professionals across Bangladesh — every badge backed by a real
              person reviewing real documents.
            </p>

            <form
              action="/search"
              className="mt-8 flex flex-col items-stretch gap-2 max-w-xl sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search by name, category, or city…"
                  className="h-12 pl-11 text-base glass-strong shadow-pop"
                  aria-label="Search businesses"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-7 font-semibold shadow-pop"
              >
                Search
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {POPULAR_CATEGORIES.map((c) => (
                <Link
                  key={c.href}
                  href={c.href as never}
                  className="rounded-full px-2 py-0.5 text-foreground/80 transition-colors hover:text-primary"
                >
                  {c.label}
                </Link>
              ))}
            </div>

            {/* Trust strip — small inline proof below the hero CTAs. */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Free for the public
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                No paid rankings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                OTP-verified reviews
              </span>
            </div>
          </div>

          <HeroPreviewCard limit={FEATURED_LIMIT} />
        </div>
      </section>

      {/* ANIMATED STATS — driven by `/stats/public`, shared with /about
          and /guidelines so the numbers stay in sync across surfaces. */}
      <section className="relative border-y border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container-wide py-12">
          <StatsStripClient />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <MotionSection className="container-wide py-20 md:py-24">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Trust, in three steps."
          subtitle="A clear path from search to decision — no algorithms, no paywalls."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, body, icon: Icon }, idx) => (
            <HowItWorksCard
              key={title}
              index={idx}
              step={step}
              title={title}
              body={body}
              icon={Icon}
            />
          ))}
        </div>
      </MotionSection>

      {/* FEATURED */}
      <section className="relative border-y border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="container-wide py-20 md:py-24">
          <SectionHeading
            eyebrow={
              <>
                <BadgeCheck className="mr-1 inline h-3 w-3 align-middle" />
                Featured
              </>
            }
            title="Featured verified businesses"
            subtitle="Highest-rated verified businesses, straight from our directory."
            action={
              <Link
                href={'/browse' as never}
                className="hidden items-center text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:inline-flex"
              >
                See all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-10">
            <FeaturedBusinesses limit={FEATURED_LIMIT} />
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Button asChild variant="outline" className="rounded-full border-2 px-6 py-3 text-sm font-medium">
              <Link href={'/browse' as never}>
                See all businesses
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <MotionSection className="container-wide py-20 md:py-24">
        <SectionHeading
          align="center"
          eyebrow="Why Credible"
          title="The trust layer users deserve."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, body }, idx) => (
            <MotionCardReveal key={title} style={{ transitionDelay: `${idx * 40}ms` }}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-6 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:shadow-glow">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </MotionCardReveal>
          ))}
        </div>
      </MotionSection>

      {/* TESTIMONIAL */}
      <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-muted/40 to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 to-transparent blur-3xl"
        />
        <MotionSection className="container-wide py-20 md:py-24">
          <figure className="mx-auto max-w-3xl text-center">
            <div
              aria-hidden
              className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary shadow-glow"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M10 7H6a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-4c0-1.5-1-2.5-1-3zm10 0h-4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-4c0-1.5-1-2.5-1-3z" />
              </svg>
            </div>
            <blockquote className="mt-6 font-display text-xl font-medium leading-relaxed text-foreground md:text-2xl">
              &ldquo;{TESTIMONIAL.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{TESTIMONIAL.author}</span>
              {' · '}
              {TESTIMONIAL.location}
            </figcaption>
          </figure>
        </MotionSection>
      </section>

      {/* CTA for businesses */}
      <section className="relative overflow-hidden">
        <div className="container-wide relative overflow-hidden rounded-b-4xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-900 to-brand-950 px-6 py-16 text-white shadow-pop md:px-14 md:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-32 right-1/3 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_1px_1px,white/12_1px,transparent_0)] [background-size:22px_22px] opacity-60 [mask-image:linear-gradient(to_left,transparent,black)]" />
            </div>

            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <BadgeCheck className="h-10 w-10 text-secondary drop-shadow-[0_0_12px_hsl(38_92%_50%/0.6)]" />
                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
                  Own a business? Get verified.
                </h2>
                <p className="mt-3 max-w-prose text-white/70">
                  Apply for the Credible Verified badge to build trust with new
                  customers. Our process is fast, transparent, and human-reviewed.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-brand-800 shadow-lg shadow-black/20 hover:bg-white/90 hover:shadow-xl"
                >
                  <Link href="/for-business">
                    Start your application
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/about">Learn more</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HowItWorksCard({
  step,
  title,
  body,
  icon: Icon,
  index,
}: {
  step: string;
  title: string;
  body: string;
  icon: typeof Search;
  index: number;
}) {
  return (
    <MotionCardReveal key={title} style={{ transitionDelay: `${index * 50}ms` }}>
      <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
        <div
          aria-hidden
          className="absolute right-5 top-4 font-display text-5xl font-bold text-foreground/5 transition-colors duration-300 select-none group-hover:text-primary/10 tabular-nums"
        >
          {step}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-brand-500/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-shadow duration-300 group-hover:shadow-glow">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </MotionCardReveal>
  );
}