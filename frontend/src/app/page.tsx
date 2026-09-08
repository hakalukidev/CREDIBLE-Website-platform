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
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/layout/section-heading';
import { FeaturedBusinesses } from '@/features/home/featured-businesses';
import { HeroPreviewCard } from '@/features/home/hero-preview-card';
import { StatsStripClient } from '@/features/home/stats-strip-client';
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
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-background to-muted/40">
        {/* Decorative soft-blob — single subtle radial glow behind the
            content. Pure decoration; not interactive. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60% 50% at 70% 20%, hsl(217 91% 60% / 0.10) 0%, transparent 70%)',
          }}
        />

        <div className="container-wide py-16 md:py-24 grid gap-12 md:grid-cols-[1.05fr_1fr] items-center">
          <div>
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Bangladesh's trust layer
            </Badge>

            <h1 className="mt-5 text-4xl sm:text-display font-bold tracking-tight leading-[1.05]">
              Find trusted businesses.{' '}
              <span className="text-primary">Verified by humans.</span>
            </h1>

            <p className="mt-5 max-w-prose text-base sm:text-lg text-muted-foreground">
              Credible helps you discover, review, and verify businesses and
              professionals across Bangladesh — every badge backed by a real
              person reviewing real documents.
            </p>

            <form
              action="/search"
              className="mt-8 flex flex-col sm:flex-row items-stretch gap-2 max-w-xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search by name, category, or city…"
                  className="pl-10 h-12 text-base shadow-sm"
                  aria-label="Search businesses"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 shadow-sm"
              >
                Search
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {POPULAR_CATEGORIES.map((c) => (
                <Link
                  key={c.href}
                  href={c.href as never}
                  className="text-foreground/80 hover:text-primary transition-colors"
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
      <section className="border-b bg-muted/30">
        <div className="container-wide py-10">
          <StatsStripClient />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-wide py-16 md:py-20 border-b">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Trust, in three steps."
          subtitle="A clear path from search to decision — no algorithms, no paywalls."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, body, icon: Icon }) => (
            <div
              key={title}
              className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-shadow hover:shadow-pop"
            >
              <div className="absolute right-5 top-5 text-5xl font-bold text-muted/40 select-none tabular-nums">
                {step}
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-wide py-16 md:py-20 border-b">
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
              className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline whitespace-nowrap"
            >
              See all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-8">
          <FeaturedBusinesses limit={FEATURED_LIMIT} />
        </div>
        <div className="mt-8 sm:hidden text-center">
          <Button asChild variant="outline">
            <Link href={'/browse' as never}>
              See all businesses
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container-wide py-16 md:py-20 border-b">
        <SectionHeading
          align="center"
          eyebrow="Why Credible"
          title="The trust layer Bangladesh deserves."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-shadow hover:shadow-pop"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="container-wide py-16 md:py-20 border-b">
        <figure className="mx-auto max-w-3xl text-center">
          <Quote
            className="mx-auto h-8 w-8 text-primary/40"
            aria-hidden
          />
          <blockquote className="mt-4 text-xl md:text-2xl font-medium leading-relaxed text-foreground">
            &ldquo;{TESTIMONIAL.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {TESTIMONIAL.author}
            </span>
            {' · '}
            {TESTIMONIAL.location}
          </figcaption>
        </figure>
      </section>

      {/* CTA for businesses */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(50% 60% at 80% 50%, hsl(38 95% 50% / 0.18) 0%, transparent 70%)',
          }}
        />
        <div className="container-wide py-16 md:py-20 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <BadgeCheck className="h-9 w-9 text-secondary" />
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Own a business? Get verified.
            </h2>
            <p className="mt-3 text-background/70 max-w-prose">
              Apply for the Credible Verified badge to build trust with new
              customers. Our process is fast, transparent, and human-reviewed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild size="lg" variant="secondary">
              <Link href="/for-business">
                Start your application
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-background/30 text-background hover:bg-background/10 hover:text-background"
            >
              <Link href="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
