import Link from 'next/link';
import {
  Utensils,
  Scale,
  Heart,
  Monitor,
  GraduationCap,
  Hammer,
  Car,
  ShoppingBag,
  Building,
  Stethoscope,
  Home,
  Briefcase,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = {
  ...pageMetadata({
    title: 'Categories',
    description:
      'Browse businesses and professionals by category on Credible.',
    path: '/categories',
  }),
  // Categories are now reachable from the Browse page filter, so we keep this
  // route as a noindex fallback for any inbound links but stop it from
  // competing with /browse in search engines.
  robots: { index: false, follow: true },
};

const CATEGORIES = [
  { name: 'Restaurants & Food', slug: 'restaurants', icon: Utensils },
  { name: 'Legal Services', slug: 'legal', icon: Scale },
  { name: 'Healthcare', slug: 'healthcare', icon: Stethoscope },
  { name: 'Technology & IT', slug: 'technology', icon: Monitor },
  { name: 'Education', slug: 'education', icon: GraduationCap },
  { name: 'Construction & Trades', slug: 'construction', icon: Hammer },
  { name: 'Automotive', slug: 'automotive', icon: Car },
  { name: 'Retail & Shopping', slug: 'retail', icon: ShoppingBag },
  { name: 'Real Estate', slug: 'real-estate', icon: Building },
  { name: 'Home Services', slug: 'home-services', icon: Home },
  { name: 'Professional Services', slug: 'professional', icon: Briefcase },
  { name: 'Wellness & Fitness', slug: 'wellness', icon: Heart },
];

export default function CategoriesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[10%] h-96 w-96 rounded-full bg-gradient-to-br from-brand-500/20 to-transparent blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-4%] h-80 w-80 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-3xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />

        <div className="container-wide relative py-20 md:py-24">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Browse
          </Badge>
          <h1 className="mt-5 font-display text-display font-bold tracking-tight">
            Explore by{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-600 to-primary">
              category
            </span>
          </h1>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
            Find trusted businesses and professionals organised by category.
          </p>
        </div>
      </section>

      <section className="container-wide py-16 md:py-20">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map(({ name, slug, icon: Icon }) => (
            <Link
              key={slug}
              href={`/browse?category=${slug}` as never}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
            >
              <Card className="h-full p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-pop">
                <CardContent className="flex flex-col items-center p-0 text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:shadow-glow">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-sm">{name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
                    Browse businesses
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}