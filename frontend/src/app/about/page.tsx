import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  Users,
  Award,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeading } from '@/components/layout/section-heading';
import { AboutStatsSection } from '@/features/about/about-stats-section';
import { MotionSection, MotionCardReveal } from '@/components/ui/motion-primitives';
import { JsonLd } from '@/components/static/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, organizationSchema } from '@/lib/seo/structured-data';

export const metadata = pageMetadata({
  title: 'About Credible',
  description:
    'Learn about Credible — the trust and verification platform helping the public find and review trusted businesses in Bangladesh.',
  path: '/about',
});

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust above all',
    body: 'Every badge backed by human review. Never auto-approved.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    body: 'Reviews, responses, and criteria — all public.',
  },
  {
    icon: Users,
    title: 'Community-driven',
    body: 'Real people, real experiences. No fakes, no paid rankings.',
  },
  {
    icon: Award,
    title: 'Excellence recognized',
    body: 'A badge businesses display and customers trust.',
  },
];

const LAUNCH_YEAR = Number.parseInt(
  process.env.NEXT_PUBLIC_LAUNCH_YEAR ?? '2026',
  10,
);

const TIMELINE = [
  {
    year: String(Number.isFinite(LAUNCH_YEAR) ? LAUNCH_YEAR : 2026),
    title: 'Public launch',
    body: 'Credible opens for verified businesses and customer reviews in Bangladesh.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'About', url: '/about' },
          ]),
          organizationSchema(),
        ]}
      />

      <PageShell
        className="relative py-12"
        eyebrow="About"
        title={
          <>
            The trust layer for{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-600 to-primary">
              Bangladesh.
            </span>
          </>
        }
        subtitle="Real customer reviews, met with rigorous verification."
      >
        <AboutStatsSection />

        <MotionSection className="mt-16">
          <section>
            <SectionHeading
              eyebrow="Our values"
              title="What we stand for"
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map(({ icon: Icon, title, body }, idx) => (
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
          </section>
        </MotionSection>

        <MotionSection className="mt-16 border-t pt-14">
          <section>
            <div className="grid items-start gap-10 md:grid-cols-2">
              <div>
                <SectionHeading title="How it works" as="h2" />
                <ol className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                  {[
                    { n: '1', strong: 'Search', body: 'Explore the directory.' },
                    { n: '2', strong: 'Read reviews', body: 'Only OTP-verified people post.' },
                    { n: '3', strong: 'Check the badge', body: 'Human-reviewed, always.' },
                    { n: '4', strong: 'Share yours', body: 'Your experience helps.' },
                  ].map((step) => (
                    <li key={step.n} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-primary text-xs font-bold text-white shadow-sm">
                        {step.n}
                      </span>
                      <p>
                        <strong className="font-semibold text-foreground">{step.strong}</strong> — {step.body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <SectionHeading title="For businesses" as="h2" />
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  Claim your profile, collect verified reviews, and apply for the Credible Verified
                  badge. Your trust score comes from real data — never paywalls.
                </p>
                <Button asChild className="mt-5 rounded-full">
                  <Link href="/for-business">
                    Learn more
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </MotionSection>

        <MotionSection className="mt-16 border-t border-border/70 pt-14">
          <section>
            <SectionHeading
              eyebrow="Team"
              title="The people behind Credible"
              subtitle="A small team in Dhaka building public trust infrastructure. We're engineers, reviewers, and community moderators — not a faceless platform."
            />
            <div className="mt-8 mx-auto max-w-3xl">
              <Card className="p-6 sm:p-8">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Our day-to-day is split across engineering, human verification review, community
                  support, and product design. We work on a public roadmap and ship in the open. If
                  you&apos;d like to get in touch with a specific team, use the contact page and we&apos;ll
                  route your message.
                </p>
                <div className="mt-5">
                  <Button asChild variant="outline">
                    <Link href="/contact">
                      Contact the team <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        </MotionSection>

        <MotionSection className="mt-16 border-t border-border/70 pt-14">
          <section>
            <SectionHeading
              eyebrow={
                <>
                  <Calendar className="mr-1 inline h-3 w-3 align-middle" /> Milestones
                </>
              }
              title="Our journey"
            />
            <ol className="relative mt-8 space-y-8 border-l border-primary/20 pl-6">
              {TIMELINE.map((entry, idx) => (
                <li key={`${entry.year}-${idx}`} className="relative pl-2">
                  <span
                    aria-hidden
                    className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)] ring-4 ring-primary/15"
                  />
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {entry.year}
                  </p>
                  <h3 className="mt-1 font-display font-semibold">{entry.title}</h3>
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {entry.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </MotionSection>

        <MotionSection className="mt-16 border-t border-border/70 pt-14">
          <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-brand-600/10 via-primary/5 to-secondary/10 p-10 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
            />
            <SectionHeading align="center" title="Our mission" />
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Trust should be earned, not bought.
            </p>
          </section>
        </MotionSection>
      </PageShell>
    </>
  );
}