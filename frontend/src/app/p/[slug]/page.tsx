'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import { Star, MapPin, Globe, Mail, Phone, Briefcase, Award } from 'lucide-react';

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
  ratingAverage: number;
  ratingCount: number;
  verified: boolean;
}

export default function PublicProfessionalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data: professional, isLoading, isError, error } = useQuery({
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
      <div className="container-wide py-8 space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !professional) {
    return (
      <div className="container-wide py-16">
        <FriendlyError kind="professional" className="max-w-xl mx-auto" />
      </div>
    );
  }

  const initials = professional.displayName
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-background">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        {professional.coverImage && (
          <SafeImage
            src={professional.coverImage}
            alt={`${professional.displayName} cover`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        )}
      </div>

      <div className="container-wide -mt-16 relative z-10 pb-12">
        <div className="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-background shadow-md bg-muted">
                  {professional.avatar ? (
                    <SafeImage
                      src={professional.avatar}
                      alt={professional.displayName}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-xl font-bold">{professional.displayName}</h1>
                {professional.title && (
                  <p className="text-sm text-muted-foreground">{professional.title}</p>
                )}
                <p className="text-sm font-medium text-primary mt-1">{professional.profession}</p>

                <div className="mt-3 flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {professional.ratingAverage
                      ? professional.ratingAverage.toFixed(1)
                      : '—'}
                  </span>
                  <span className="text-muted-foreground">
                    ({professional.ratingCount} review
                    {professional.ratingCount === 1 ? '' : 's'})
                  </span>
                </div>

                {professional.verified && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <Award className="h-3 w-3" /> Credible Verified
                  </div>
                )}

                <Button asChild className="w-full mt-5">
                  <Link href={`/submit-review?professionalId=${professional.id}` as never}>
                    Write a review
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {(professional.city || professional.country || professional.website || professional.email || professional.phone) && (
              <Card>
                <CardContent className="pt-6 space-y-2 text-sm">
                  {(professional.city || professional.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span>
                        {[professional.city, professional.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {professional.website && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <a
                        href={professional.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {professional.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {professional.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${professional.email}`} className="hover:underline truncate">
                        {professional.email}
                      </a>
                    </div>
                  )}
                  {professional.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span>{professional.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Main */}
          <div className="space-y-6 min-w-0">
            {professional.headline && (
              <p className="text-lg text-muted-foreground">{professional.headline}</p>
            )}

            {professional.bio && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold mb-2">About</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {professional.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {professional.specialties.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Specialties
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {professional.specialties.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {(professional.yearsOfExperience !== null ||
                professional.languages.length > 0) && (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    {professional.yearsOfExperience !== null && professional.yearsOfExperience !== undefined && (
                      <div>
                        <h2 className="text-sm font-semibold text-muted-foreground">Experience</h2>
                        <p className="text-lg font-medium">
                          {professional.yearsOfExperience} year
                          {professional.yearsOfExperience === 1 ? '' : 's'}
                        </p>
                      </div>
                    )}
                    {professional.languages.length > 0 && (
                      <div>
                        <h2 className="text-sm font-semibold text-muted-foreground">Languages</h2>
                        <p className="text-sm">{professional.languages.join(', ')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold">
                    Reviews ({professional.ratingCount})
                  </h2>
                  <Button asChild size="sm">
                    <Link href={`/submit-review?professionalId=${professional.id}` as never}>
                      Write a review
                    </Link>
                  </Button>
                </div>
                {reviews && reviews.data.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.data.map((r) => (
                      <ReviewItem key={r.id} review={r} viewer="PUBLIC" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No reviews yet. Be the first to share your experience.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}