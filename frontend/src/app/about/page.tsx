import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  Users,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    body: 'Every verification badge is backed by human review. We never auto-approve — our team personally inspects every application.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    body: 'Reviews are public. Business responses are public. Our verification criteria are public. Trust is built on openness.',
  },
  {
    icon: Users,
    title: 'Community-driven',
    body: 'Our platform is powered by real people sharing real experiences. No fake reviews. No paid rankings.',
  },
  {
    icon: Award,
    title: 'Excellence recognized',
    body: 'The Credible badge is a mark of quality that businesses proudly display and customers instantly trust.',
  },
];

const TEAM = [
  {
    name: 'Credible Engineering',
    role: 'Platform & Infrastructure',
    bio: 'Designs, builds, and operates the platform that powers trust for thousands of businesses across Bangladesh.',
    initials: 'CE',
  },
  {
    name: 'Verification Team',
    role: 'Human Reviewers',
    bio: 'Reviews every application personally. Documents, photos, business records — nothing ships a badge without a real person behind it.',
    initials: 'VT',
  },
  {
    name: 'Community & Support',
    role: 'Moderation & Care',
    bio: 'Keeps the conversation honest. Reviews reports, enforces guidelines, and helps users and businesses alike.',
    initials: 'CS',
  },
  {
    name: 'Product & Design',
    role: 'UX & Research',
    bio: 'Ships the features you use every day. Talks to real customers, writes real copy, and ships real improvements every week.',
    initials: 'PD',
  },
];

const TIMELINE = [
  {
    year: '2026',
    title: 'Public launch',
    body: 'Credible opens to the public with verified business listings, customer reviews, and a transparent verification program.',
  },
  {
    year: '2026',
    title: 'Professional profiles',
    body: 'Solo practitioners — doctors, lawyers, consultants — get their own profile type, with category-specific verification.',
  },
  {
    year: '2026',
    title: 'Embeddable widgets',
    body: 'Verified businesses can drop the Credible badge on their own website with a single snippet, linking back to their public profile.',
  },
  {
    year: '2026',
    title: 'Founding team',
    body: 'A small, focused group of engineers, designers, and operators set out to build the trust layer Bangladesh\'s businesses deserve.',
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
            Building the{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-600 to-primary">
              infrastructure of trust
            </span>
          </>
        }
        subtitle="Credible was created to solve a simple problem: it's hard to know which businesses to trust. We provide a transparent platform where real customer reviews meet rigorous verification — so you can make confident decisions."
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
                    {
                      n: '1',
                      strong: 'Find a business',
                      body: 'Search our directory of businesses and professionals across Bangladesh.',
                    },
                    {
                      n: '2',
                      strong: 'Read real reviews',
                      body: 'See verified reviews from real customers, with OTP-confirmed submissions.',
                    },
                    {
                      n: '3',
                      strong: 'Check verification',
                      body: 'Look for the Credible Verified or Certified badge, backed by human document review.',
                    },
                    {
                      n: '4',
                      strong: 'Leave your own review',
                      body: 'Share your experience to help others make informed decisions.',
                    },
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
                  Credible gives businesses the tools to earn and display public trust. Claim your
                  profile, collect verified reviews, and apply for the prestigious Credible Verified
                  badge. Your trust score is computed transparently from real data — not algorithms
                  or paywalls.
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
              eyebrow={
                <>
                  <Sparkles className="mr-1 inline h-3 w-3 align-middle" /> Team
                </>
              }
              title="The people behind Credible"
              subtitle="A small, focused group shipping real infrastructure for trust."
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member, idx) => (
                <MotionCardReveal key={member.name} style={{ transitionDelay: `${idx * 40}ms` }}>
                  <Card className="h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/15">
                      <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary font-semibold text-primary-foreground">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-display font-semibold">{member.name}</h3>
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                  </Card>
                </MotionCardReveal>
              ))}
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
              subtitle="From a small idea to a public trust platform — the milestones so far."
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
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
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
              We believe trust should be earned, not bought. Credible exists to make that belief a
              reality — creating a level playing field where great businesses rise on merit, and
              customers always know what they&apos;re getting into.
            </p>
          </section>
        </MotionSection>
      </PageShell>
    </>
  );
}