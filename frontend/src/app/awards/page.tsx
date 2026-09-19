import Link from 'next/link';
import {
  Trophy,
  Award,
  ArrowRight,
  ShieldCheck,
  Users,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/layout/section-heading';
import { MotionSection, MotionCardReveal } from '@/components/ui/motion-primitives';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Awards',
  description:
    'Credible Awards recognise the best businesses and professionals in every category — human-reviewed and proudly earned.',
  path: '/awards',
});

const AWARD_STEPS = [
  {
    icon: ShieldCheck,
    title: 'Human-reviewed',
    body: 'Every nominee checked against documents.',
  },
  {
    icon: Users,
    title: 'Real signal',
    body: 'Weighted by OTP-verified ratings and reviews.',
  },
  {
    icon: BadgeCheck,
    title: 'Best in category',
    body: 'One winner per category, with a shareable award.',
  },
];

export default function AwardsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[8%] h-96 w-96 rounded-full bg-gradient-to-br from-brand-500/20 to-transparent blur-3xl" />
          <div className="absolute bottom-[-30%] left-[6%] h-80 w-80 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-3xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />

        <div className="container-wide relative py-20 text-center md:py-24">
          <Badge
            variant="outline"
            className="border-secondary/25 bg-secondary/10 px-3 py-1 text-secondary"
          >
            <Award className="mr-1.5 h-3 w-3" />
            Credible Awards
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-display font-bold tracking-tight">
            The best in every{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-600 to-primary">
              category.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Earned by real customer trust. Judged by humans.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="outline">
              <Link href="/browse">
                Explore verified businesses
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="gradient-primary">
              <Link href="/for-business">Nominate your business</Link>
            </Button>
          </div>
        </div>
      </section>

      <MotionSection className="container-wide py-16 md:py-20">
        <SectionHeading
          align="center"
          eyebrow="How awards work"
          title="Awards you can trust."
          subtitle="Unlike paid trophies, Credible Awards are earned — judged by real customer signal and human review."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {AWARD_STEPS.map(({ icon: Icon, title, body }, idx) => (
            <MotionCardReveal key={title} style={{ transitionDelay: `${idx * 40}ms` }}>
              <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/25 to-secondary/5 text-secondary ring-1 ring-secondary/20">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            </MotionCardReveal>
          ))}
        </div>
      </MotionSection>

      <section className="border-y border-border/60 bg-gradient-to-b from-muted/40 to-background">
        <div className="container-wide py-16 md:py-20">
          <SectionHeading
            eyebrow="First awards cycle"
            title="Nominations are open"
            subtitle="Our first Best-in-Category awards open for nominations once the verification cycle completes. Verified businesses are eligible automatically."
          />
          <div className="mt-10 mx-auto max-w-2xl">
            <Card className="p-8 text-center sm:p-10">
              <span
                aria-hidden
                className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-secondary/10 text-secondary ring-1 ring-secondary/20"
              >
                <Sparkles className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                No winners have been announced yet
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The first Credible Awards cycle starts once we have a meaningful base of verified
                businesses and reviews. Every verified business will be eligible, and we&apos;ll
                announce categories, judges, and the timeline right here.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/for-business">
                    Get verified to be eligible <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact?subject=awards">Ask about nominations</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <MotionSection className="container-wide py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-8 text-center shadow-card md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent"
          />
          <Trophy className="mx-auto h-12 w-12 text-secondary" aria-hidden />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Could your business win?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Get verified. Earn the badge. Let reviews speak.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="gradient-primary">
              <Link href="/for-business">
                Get verified
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </MotionSection>
    </>
  );
}
