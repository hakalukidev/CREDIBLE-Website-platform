import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  Users,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeading } from '@/components/layout/section-heading';
import { AboutStatsSection } from '@/features/about/about-stats-section';
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
        className="py-12"
        eyebrow="About"
        title="Building the infrastructure of trust"
        subtitle="Credible was created to solve a simple problem: it's hard to know which businesses to trust. We provide a transparent platform where real customer reviews meet rigorous verification — so you can make confident decisions."
      >
          <AboutStatsSection />

          <section className="mt-12">
            <SectionHeading title="What we stand for" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="p-6 shadow-card transition-shadow hover:shadow-pop">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t pt-12">
            <div className="grid gap-8 md:grid-cols-2 items-start">
              <div>
                <SectionHeading title="How it works" as="h2" />
                <ol className="mt-6 space-y-4 text-sm text-muted-foreground list-decimal list-inside">
                  <li>
                    <strong className="text-foreground">Find a business</strong> — Search our directory
                    of businesses and professionals across Bangladesh.
                  </li>
                  <li>
                    <strong className="text-foreground">Read real reviews</strong> — See verified
                    reviews from real customers, with OTP-confirmed submissions.
                  </li>
                  <li>
                    <strong className="text-foreground">Check verification</strong> — Look for the
                    Credible Verified or Certified badge, backed by human document review.
                  </li>
                  <li>
                    <strong className="text-foreground">Leave your own review</strong> — Share your
                    experience to help others make informed decisions.
                  </li>
                </ol>
              </div>
              <div>
                <SectionHeading title="For businesses" as="h2" />
                <p className="mt-6 text-sm text-muted-foreground">
                  Credible gives businesses the tools to earn and display public trust. Claim your
                  profile, collect verified reviews, and apply for the prestigious Credible Verified
                  badge. Your trust score is computed transparently from real data — not algorithms
                  or paywalls.
                </p>
                <Button asChild className="mt-4 rounded-full" variant="outline">
                  <Link href="/for-business">Learn more</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-12 border-t pt-12">
            <SectionHeading
              eyebrow={
                <>
                  <Sparkles className="mr-1 inline h-3 w-3 align-middle" /> Team
                </>
              }
              title="The people behind Credible"
              subtitle="A small, focused group shipping real infrastructure for trust."
            />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member) => (
                <Card key={member.name} className="p-6 shadow-card">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 font-semibold">{member.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {member.role}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t pt-12">
            <SectionHeading
              eyebrow={
                <>
                  <Calendar className="mr-1 inline h-3 w-3 align-middle" /> Milestones
                </>
              }
              title="Our journey"
              subtitle="From a small idea to a public trust platform — the milestones so far."
            />
            <ol className="relative mt-8 border-l border-primary/30 pl-6 space-y-8">
              {TIMELINE.map((entry, idx) => (
                <li key={`${entry.year}-${idx}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"
                  />
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {entry.year}
                  </p>
                  <h3 className="mt-1 font-semibold">{entry.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12 border-t pt-12">
            <SectionHeading title="Our mission" />
            <p className="mt-6 max-w-prose text-muted-foreground">
              We believe trust should be earned, not bought. Credible exists to make that belief a
              reality — creating a level playing field where great businesses rise on merit, and
              customers always know what they&apos;re getting into.
            </p>
          </section>
        </PageShell>
    </>
  );
}
