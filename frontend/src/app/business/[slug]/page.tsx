import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Globe, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/reviews/star-rating';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { ReviewsTab } from '@/components/business/reviews-tab';
import { ReviewForm } from '@/features/review/review-form';
import { ContactForm } from '@/features/business/contact-form';
import { GalleryCarousel } from '@/components/business/gallery-carousel';
import { HoursCard } from '@/components/business/hours-card';
import { businessMetadata } from '@/lib/seo/metadata';
import {
  businessSchema,
  breadcrumbSchema,
  reviewSchema,
  reviewListSchema,
} from '@/lib/seo/structured-data';
import type { BusinessHoursJson } from '@/types/business';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function fetchBusiness(slug: string) {
  try {
    const res = await fetch(`${API_URL}/businesses/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { success: true; data: BusinessDto };
    return body.data;
  } catch {
    return null;
  }
}

async function fetchTopReviews(businessId: string) {
  try {
    const res = await fetch(
      `${API_URL}/businesses/${encodeURIComponent(businessId)}/reviews?perPage=3&sortBy=helpful`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as {
      success: true;
      data: Array<{
        id: string;
        rating: number;
        title?: string;
        content: string;
        createdAt: string;
        helpfulCount?: number;
        response?: { content: string; createdAt: string };
        user: { id: string; firstName?: string; lastName?: string };
      }>;
    };
    return body.data;
  } catch {
    return [];
  }
}

interface BusinessDto {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  tagline?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  /** At most 6 photo URLs. Backend stores as JSONB. */
  gallery?: string[] | null;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  hoursJson?: BusinessHoursJson;
  priceRange?: string;
  ratingAverage?: string;
  ratingCount: number;
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  verificationStatus: string;
  badgeHash?: string;
  category?: { id: string; slug: string; name: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug);
  if (!business) return { title: 'Business not found' };
  return businessMetadata({
    name: business.displayName,
    description: business.description,
    slug: business.slug,
    ratingAverage: Number(business.ratingAverage ?? 0),
    ratingCount: business.ratingCount,
    city: business.city,
    logo: business.logo,
  });
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const business = await fetchBusiness(slug);
  if (!business) return notFound();

  const isVerified = business.verificationStatus === 'APPROVED' && business.verificationLevel !== 'NONE';
  const reviews = await fetchTopReviews(business.id);

  const reviewInputs = reviews.map((r) => ({
    businessSlug: business.slug,
    businessName: business.displayName,
    reviewId: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    author: [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || 'Anonymous',
    authorId: r.user.id,
    createdAt: r.createdAt,
    helpfulCount: r.helpfulCount,
    response: r.response
      ? { content: r.response.content, at: r.response.createdAt }
      : undefined,
  }));

  const jsonLd = [
    businessSchema({
      slug: business.slug,
      name: business.displayName,
      description: business.description,
      logo: business.logo,
      city: business.city,
      state: business.state,
      country: business.country,
      postalCode: business.postalCode,
      streetAddress: business.addressLine1,
      phone: business.phone,
      email: business.email,
      website: business.website,
      latitude: business.latitude,
      longitude: business.longitude,
      hoursJson: business.hoursJson,
      priceRange: business.priceRange,
      category: business.category?.name,
      ratingAverage: Number(business.ratingAverage ?? 0),
      ratingCount: business.ratingCount,
      isVerified,
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Businesses', url: '/search' },
      ...(business.category
        ? [{ name: business.category.name, url: `/search?category=${business.category.slug}` }]
        : []),
      { name: business.displayName, url: `/business/${business.slug}` },
    ]),
    // ItemList graph node — Google uses this to render review carousels.
    reviewListSchema(business.slug, business.displayName, reviewInputs),
    // Each individual Review node — fully attributed with author @id,
    // publisher @id and isPartOf backlink to the LocalBusiness @id.
    ...reviewInputs.map((r) => reviewSchema(r)),
  ];

  return (
    <>
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <PageShell
        className="py-10"
        eyebrow={business.category?.name ?? 'Business profile'}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {business.displayName}
            {isVerified && <VerifiedBadge level={business.verificationLevel} size="lg" />}
          </span>
        }
        subtitle={
          business.tagline ??
          (business.description?.slice(0, 160) ?? 'View profile, hours, contact, and reviews.')
        }
        headerAction={
          <Button asChild size="lg" className="rounded-full">
            <Link href="#write-review">
              <MessageSquare className="mr-2 h-4 w-4" /> Write a review
            </Link>
          </Button>
        }
      >
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <StarRating value={Number(business.ratingAverage ?? 0)} />
            <span className="font-medium text-foreground">
              {Number(business.ratingAverage ?? 0).toFixed(1)}
            </span>
            <span>·</span>
            <span>{business.ratingCount} reviews</span>
          </span>
          {business.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {business.city}
              {business.country ? `, ${business.country}` : ''}
            </span>
          )}
          {business.category && (
            <Badge variant="secondary">{business.category.name}</Badge>
          )}
        </div>

        {business.gallery && business.gallery.length > 0 && (
          <GalleryCarousel
            images={business.gallery}
            alt={business.displayName}
            className="rounded-2xl shadow-card"
          />
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({business.ratingCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {business.description && (
                <Card className="p-6">
                  <h2 className="font-semibold">About</h2>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                    {business.description}
                  </p>
                </Card>
              )}
              <ReviewsTab businessId={business.id} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-6 space-y-6">
              <div id="write-review">
                <ReviewForm businessId={business.id} />
              </div>
              <Separator />
              <ReviewsTab businessId={business.id} />
            </TabsContent>
          </Tabs>

          <aside className="space-y-4">
            <HoursCard hours={business.hoursJson ?? undefined} />

            <Card className="p-6">
              <h3 className="font-semibold">Contact</h3>
              <div className="mt-3 space-y-3 text-sm">
                {business.addressLine1 && (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    {business.addressLine1}
                    {business.city ? `, ${business.city}` : ''}
                  </p>
                )}
                {business.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a>
                  </p>
                )}
                {business.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${business.email}`} className="hover:underline truncate">{business.email}</a>
                  </p>
                )}
                {business.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={business.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                      {business.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                )}
              </div>
            </Card>

            {isVerified && business.badgeHash && (
              <Card className="p-6">
                <h3 className="font-semibold">Verified by Credible</h3>
                <p className="mt-1 text-xs text-muted-foreground">Public verification ID:</p>
                <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">
                  {SITE_URL}/verify/{business.badgeHash}
                </code>
                <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
                  <Link href={`/verify/${business.badgeHash}`}>View badge</Link>
                </Button>
              </Card>
            )}

            <ContactForm businessId={business.id} businessName={business.displayName} />
          </aside>
        </div>
      </PageShell>
    </>
  );
}
