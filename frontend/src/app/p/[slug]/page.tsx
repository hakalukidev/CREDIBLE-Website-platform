'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { Star, MapPin, Globe, Mail, Phone, MessageSquare } from 'lucide-react';

import { PageShell } from '@/components/layout/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import { StarRating } from '@/components/reviews/star-rating';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { FriendlyError } from '@/components/ui/friendly-error';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';

import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

type VerificationLevel = 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';

interface PublicProfessional {
  id: string;
  slug: string;
  title?: string | null;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  profession: string;
  specialties: string[];
  yearsOfExperience?: number | null;
  languages: string[];
  avatar?: string | null;
  coverImage?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  status: string;
  ratingAverage: number | string | null;
  ratingCount: number;
  verified: boolean;
  verificationStatus?: string;
  verificationLevel?: VerificationLevel;
}

export default function PublicProfessionalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const {
    data: professional,
    isLoading,
    isError,
  } = useQuery({
    queryKey: qk.professionals.profile(slug),
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: PublicProfessional }>(
        `/professionals/slug/${slug}`,
      );
      return res.data.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'professional', 'public', professional?.id ?? null],
    enabled: Boolean(professional?.id),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{
          success: true;
          data: ReviewItemModel[];
        }>(`/reviews/professional/${professional!.id}`);
        return res.data;
      } catch {
        return { success: true as const, data: [] as ReviewItemModel[] };
      }
    },
  });

  if (isLoading) {
    return (
      <div className="container-wide space-y-6 py-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !professional) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <FriendlyError kind="professional" className="max-w-xl" />
      </div>
    );
  }

  const ratingAvg =
    professional.ratingAverage != null && professional.ratingAverage !== ''
      ? Number(professional.ratingAverage)
      : 0;

  const isVerified =
    (professional.verificationStatus === 'APPROVED' || professional.verified) &&
    professional.verificationLevel !== 'NONE' &&
    professional.verificationLevel != null;

  const verifiedLevel: VerificationLevel = isVerified
    ? (professional.verificationLevel ?? 'CERTIFIED')
    : 'NONE';

  return (
    <PageShell
      className="py-10"
      eyebrow={professional.profession}
      title={
        <span className="flex flex-wrap items-center gap-3">
          {professional.displayName}
          {verifiedLevel !== 'NONE' && (
            <VerifiedBadge level={verifiedLevel} size="lg" />
          )}
        </span>
      }
      subtitle={
        professional.headline ??
        professional.bio?.slice(0, 160) ??
        'View profile, expertise, contact, and reviews.'
      }
      headerAction={
        <Button asChild size="lg" className="rounded-full">
          <Link href={`/submit-review?professionalId=${professional.id}` as never}>
            <MessageSquare className="mr-2 h-4 w-4" /> Write a review
          </Link>
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <StarRating value={ratingAvg} />
          <span className="font-medium text-foreground">
            {ratingAvg.toFixed(1)}
          </span>
          <span>·</span>
          <span>{professional.ratingCount} reviews</span>
        </span>
        {(professional.city || professional.country) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {professional.city ?? ''}
            {professional.country ? `, ${professional.country}` : ''}
          </span>
        )}
        {professional.yearsOfExperience != null &&
          professional.yearsOfExperience > 0 && (
            <Badge variant="secondary">
              {professional.yearsOfExperience}+ years experience
            </Badge>
          )}
      </div>

      {(professional.coverImage || professional.avatar) && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="relative aspect-[5/2] w-full">
            {professional.coverImage ? (
              <SafeImage
                src={professional.coverImage}
                alt={`${professional.displayName} cover photo`}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="h-full w-full bg-gradient-to-br from-primary/20 to-gold-100"
                aria-hidden
              />
            )}
          </div>
          {professional.avatar && (
            <div className="flex items-end gap-3 px-4 pb-4 sm:px-6 sm:pb-5 -mt-8 sm:-mt-10">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-card sm:h-20 sm:w-20">
                <SafeImage
                  src={professional.avatar}
                  alt={`${professional.displayName} profile photo`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({professional.ratingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {professional.bio && (
              <Card className="p-6">
                <h2 className="font-semibold">About</h2>
                <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                  {professional.bio}
                </p>
              </Card>
            )}

            {(professional.specialties.length > 0 ||
              professional.languages.length > 0) && (
              <Card className="p-6">
                <h2 className="font-semibold">Expertise</h2>
                <div className="mt-3 space-y-4">
                  {professional.specialties.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Specialties
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {professional.specialties.map((s) => (
                          <Badge key={s} variant="outline" className="text-primary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {professional.languages.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Languages
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {professional.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <ProfessionalPublicReviews
              reviews={reviews?.data ?? []}
              fallbackMessage="No reviews yet for this professional."
            />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-6">
            <div
              id="write-review"
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
            >
              <h2 className="font-semibold">Write a review</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your experience working with {professional.displayName}.
              </p>
              <Button asChild className="mt-4 rounded-full">
                <Link href={`/submit-review?professionalId=${professional.id}` as never}>
                  <Star className="mr-2 h-4 w-4" />
                  Start a review
                </Link>
              </Button>
            </div>
            <Separator />
            <ProfessionalPublicReviews
              reviews={reviews?.data ?? []}
              fallbackMessage="No reviews yet. Be the first to share your experience."
            />
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          {(professional.email || professional.phone || professional.website) && (
            <Card className="p-6">
              <h3 className="font-semibold">Contact</h3>
              <div className="mt-3 space-y-3 text-sm">
                {professional.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${professional.email}`}
                      className="truncate hover:underline"
                    >
                      {professional.email}
                    </a>
                  </p>
                )}
                {professional.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${professional.phone}`} className="hover:underline">
                      {professional.phone}
                    </a>
                  </p>
                )}
                {professional.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={professional.website}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline"
                    >
                      {professional.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                )}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </PageShell>
  );
}

function ProfessionalPublicReviews({
  reviews,
  fallbackMessage,
}: {
  reviews: ReviewItemModel[];
  fallbackMessage: string;
}) {
  if (reviews.length > 0) {
    return (
      <div className="space-y-4">
        {reviews.map((r) => (
          <ReviewItem key={r.id} review={r} viewer="PUBLIC" />
        ))}
      </div>
    );
  }
  return (
    <Card className="p-8 text-center">
      <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />
      <p className="mt-3 text-sm text-muted-foreground">{fallbackMessage}</p>
    </Card>
  );
}
