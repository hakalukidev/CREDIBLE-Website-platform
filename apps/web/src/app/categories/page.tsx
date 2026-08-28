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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Categories',
  description:
    'Browse businesses and professionals by category on Credible.',
  path: '/categories',
});

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
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Browse
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Categories</h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Find trusted businesses and professionals organised by category.
          </p>
        </div>
      </section>

      <section className="container-wide py-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map(({ name, slug, icon: Icon }) => (
          <Link key={slug} href={`/search?category=${slug}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:shadow-md">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold text-sm">{name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Browse businesses</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </>
  );
}
