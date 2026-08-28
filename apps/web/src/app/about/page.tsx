import Link from 'next/link';
import { ShieldCheck, Eye, Users, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pageMetadata } from '@/lib/seo/metadata';

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
    name: 'Credible Team',
    role: 'Engineering & Operations',
    bio: 'A small, focused team building the infrastructure of trust for Bangladesh\'s business ecosystem.',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            About
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Building the infrastructure of trust
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Credible was created to solve a simple problem: it&apos;s hard to know which businesses to
            trust. We provide a transparent platform where real customer reviews meet rigorous
            verification — so you can make confident decisions.
          </p>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {VALUES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container-wide py-12">
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-4 space-y-4 text-sm text-muted-foreground list-decimal list-inside">
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
            <h2 className="text-2xl font-bold tracking-tight">For businesses</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Credible gives businesses the tools to earn and display public trust. Claim your
              profile, collect verified reviews, and apply for the prestigious Credible Verified
              badge. Your trust score is computed transparently from real data — not algorithms or
              paywalls.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/for-business">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-wide py-12 border-t">
        <h2 className="text-2xl font-bold tracking-tight">Our mission</h2>
        <p className="mt-3 max-w-prose text-muted-foreground">
          We believe trust should be earned, not bought. Credible exists to make that belief a
          reality — creating a level playing field where great businesses rise on merit, and
          customers always know what they&apos;re getting into.
        </p>
      </section>
    </>
  );
}
