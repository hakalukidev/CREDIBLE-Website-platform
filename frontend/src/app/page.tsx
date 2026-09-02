import Link from 'next/link';
import { Search, ShieldCheck, BadgeCheck, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FeaturedBusinesses } from '@/features/home/featured-businesses';
import { HeroPreviewCard } from '@/features/home/hero-preview-card';
import {
  organizationSchema,
  websiteSchemaWithSearchAction,
  webApplicationSchema,
} from '@/lib/seo/structured-data';

const FEATURED_LIMIT = 4;

export default function HomePage() {
  // Aggregator-level JSON-LD: this is the single most important block for
  // establishing Credible as a recognised review aggregator in Google.
  // Each node uses @id so the homepage graph is internally consistent.
  const homeJsonLd = [
    organizationSchema(),
    websiteSchemaWithSearchAction(),
    webApplicationSchema(),
  ];

  return (
    <>
      {homeJsonLd.map((data, i) => (
        <script
          key={`home-ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      {/* HERO */}
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16 md:py-24 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Trusted review platform
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Find trusted businesses.
              <br />
              <span className="text-primary">Verified.</span>
            </h1>
            <p className="mt-4 max-w-prose text-muted-foreground">
              Credible helps you discover, review, and verify businesses and professionals across
              Bangladesh. Businesses earn the prestigious Credible Verified badge to build trust with
              the public.
            </p>
            <form action="/search" className="mt-6 flex items-center gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search by name, category, or city…"
                  className="pl-9 h-12 text-base"
                  aria-label="Search businesses"
                />
              </div>
              <Button type="submit" size="lg">Search</Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Popular:</span>
              <Link href="/search?category=restaurants" className="hover:text-foreground">Restaurants</Link>
              <Link href="/search?category=legal" className="hover:text-foreground">Legal</Link>
              <Link href="/search?category=health" className="hover:text-foreground">Health</Link>
              <Link href="/search?category=tech" className="hover:text-foreground">IT</Link>
            </div>
          </div>

          {/* Right visual: a credible "profile card" preview.
              Everything shown here comes from the live database — never hard-coded.
              Uses the same in-flight request cache as FeaturedBusinesses, so the two
              share a single network round-trip despite being separate components. */}
          <HeroPreviewCard limit={FEATURED_LIMIT} />
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container-wide py-12 md:py-16 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: 'Verified & Certified',
            body: 'Every business can earn the Credible Verified or Certified badge through our human-reviewed workflow.',
          },
          {
            icon: Star,
            title: 'Honest Reviews',
            body: 'One review per person per business. Edit within 24 hours. Businesses can respond publicly.',
          },
          {
            icon: Users,
            title: 'Public Trust',
            body: 'Transparent profile pages, business responses, and easy-to-share QR codes for in-store trust.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* FEATURED — all data sourced from the database */}
      <section className="container-wide pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Featured verified businesses
            </h2>
            <p className="text-sm text-muted-foreground">
              Highest-rated verified businesses, straight from our directory.
            </p>
          </div>
          <Link href="/search" className="text-sm text-primary hover:underline whitespace-nowrap">
            See all →
          </Link>
        </div>
        <FeaturedBusinesses limit={FEATURED_LIMIT} />
      </section>

      {/* CTA for businesses */}
      <section className="bg-foreground text-background">
        <div className="container-wide py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <BadgeCheck className="h-8 w-8 text-secondary" />
            <h2 className="mt-3 text-2xl md:text-3xl font-bold">Own a business? Get verified.</h2>
            <p className="mt-2 text-background/70 max-w-prose">
              Apply for the Credible Verified badge to build trust with new customers. Our process
              is fast, transparent, and human-reviewed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register-business">Start your application</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-background/40 text-background hover:bg-background/10">
              <Link href="/for-business">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}