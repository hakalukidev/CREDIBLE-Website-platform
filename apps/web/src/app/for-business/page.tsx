import Link from 'next/link';
import { ShieldCheck, Award, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'For business',
  description: 'Earn the Credible Verified badge and grow trust with customers.',
};

const PLANS = [
  {
    name: 'Free',
    price: '0',
    description: 'Get listed and collect reviews.',
    features: ['Public profile page', 'Customer reviews', 'Email notifications', 'Basic analytics'],
    cta: 'Start free',
  },
  {
    name: 'Basic',
    price: '1,500',
    description: 'For businesses ready to verify their trust.',
    features: ['Everything in Free', 'Credible Verified badge', 'Document upload & review', 'SEO enhancements'],
    cta: 'Get Basic',
    highlight: true,
  },
  {
    name: 'Professional',
    price: '3,500',
    description: 'For growing teams that need more.',
    features: ['Everything in Basic', 'Multiple businesses', 'Priority support', 'Review response tools'],
    cta: 'Get Professional',
  },
  {
    name: 'Enterprise',
    price: '9,500',
    description: 'Scale across many brands and locations.',
    features: ['Everything in Professional', 'API access', 'SLA & onboarding', 'White-glove verification'],
    cta: 'Contact sales',
  },
];

export default function ForBusinessPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">For Business</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Build trust. Earn the badge.
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Credible helps you earn public trust with a verified profile, prestigious badges, and a
            frictionless review experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register-business">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, title: 'Human-reviewed verification', body: 'No bots — every application is reviewed by our team.' },
          { icon: Award, title: 'Prestigious badges', body: 'Downloadable, shareable, verifiable badge assets.' },
          { icon: MessageSquare, title: 'Two-way reviews', body: 'Publicly respond to reviews and resolve concerns.' },
          { icon: BarChart3, title: 'Transparent analytics', body: 'Track trust signals and review trends over time.' },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="pricing" className="container-wide py-12">
        <h2 className="text-2xl font-bold tracking-tight">Simple, transparent pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">All plans include a 14-day free trial.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <Card key={p.name} className={p.highlight ? 'border-primary shadow-md' : ''}>
              <CardContent className="pt-6">
                {p.highlight && <Badge className="mb-2">Most popular</Badge>}
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="mt-2 text-3xl font-bold">
                  ৳{p.price}
                  <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-5 w-full" variant={p.highlight ? 'default' : 'outline'} asChild>
                  <Link href="/register-business">{p.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}