import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  UserCheck,
  Building2,
  Sparkles,
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

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search',
    body: 'Find businesses near you.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Verify',
    body: 'Look for the human-reviewed badge.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Decide',
    body: 'Read verified reviews. Choose with confidence.',
    icon: CheckCircle2,
  },
];

const TRUST_POINTS = [
  { icon: Smartphone, label: 'OTP-verified' },
  { icon: UserCheck, label: 'One per person' },
  { icon: ShieldCheck, label: 'Human-reviewed' },
];

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
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-brand-500/25 to-transparent blur-3xl animate-pulse-glow" />
          <div className="absolute top-1/3 left-[-8%] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-secondary/20 to-transparent blur-3xl animate-pulse-glow [animation-delay:-2s]" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

        <div className="container-wide relative grid items-center gap-14 py-10 md:py-16 md:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              Bangladesh&apos;s trust layer
            </Badge>

            <h1 className="mt-6 font-display text-display font-bold tracking-tight text-foreground">
              Find verified{' '}
              <span className="text-gradient bg-gradient-to-r from-brand-600 via-primary to-brand-500 anim-gradient animate-gradient-shift">
                businesses.
              </span>
            </h1>

            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
              Real reviews. Human-checked badges.
            </p>

            <form
              action="/search"
              className="mt-8 flex max-w-xl flex-col items-stretch gap-2 sm:flex-row"
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
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Free
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                No paid rankings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                OTP-verified
              </span>
            </div>
          </div>

          <HeroPreviewCard limit={FEATURED_LIMIT} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <MotionSection className="container-wide py-8 md:py-12">
        <SectionHeading align="center" eyebrow="How it works" title="Trust, in three steps." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
        <div className="container-wide py-8 md:py-12">
          <SectionHeading
            eyebrow={
              <>
                <BadgeCheck className="mr-1 inline h-3 w-3 align-middle" />
                Featured
              </>
            }
            title="Verified businesses"
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
            <Button asChild variant="outline" className="px-6 py-3 text-sm font-medium">
              <Link href={'/browse' as never}>
                See all businesses
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ANIMATED STATS */}
      <section className="relative border-y border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container-wide py-12">
          <StatsStripClient />
        </div>
      </section>

      {/* WHY IT'S AUTHENTIC */}
      <MotionSection className="border-y border-border/60 bg-gradient-to-b from-muted/40 to-background">
        <div className="container-wide py-16 md:py-20">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <ShieldCheck className="mr-1.5 h-3 w-3" />
              Staying authentic
            </Badge>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Honest by design.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every layer of a review is manual — by phone, by person, by hand.
            </p>
            <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
              {TRUST_POINTS.map(({ icon: Icon, label }, idx) => (
                <MotionCardReveal key={label} style={{ transitionDelay: `${idx * 40}ms` }}>
                  <div className="flex h-full items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card/80 py-4 shadow-card backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                </MotionCardReveal>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                href={'/guidelines' as never}
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Read the guidelines
                <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
              <Link
                href={'/for-professionals' as never}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                For professionals
              </Link>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* CTA for businesses */}
      <section className="container-wide py-16 md:py-20">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 via-brand-900 to-brand-950 px-6 py-14 text-white shadow-lift md:px-12">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 right-1/3 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Building2 className="h-9 w-9 text-secondary" aria-hidden />
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Own a business? Get verified.
              </h2>
              <p className="mt-2 text-white/70">
                Fast, transparent, and human-reviewed.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
                <Link href="/for-professionals">For professionals</Link>
              </Button>
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
      <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-6 shadow-card transition-all duration-300 ease-out-quart hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-lift">
        <div
          aria-hidden
          className="absolute right-5 top-4 font-display text-5xl font-bold text-foreground/5 transition-colors duration-300 select-none group-hover:text-primary/10 tabular-nums"
        >
          {step}
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-shadow duration-300 group-hover:shadow-glow">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </MotionCardReveal>
  );
}