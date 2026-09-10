'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import { apiClient } from '@/lib/api/client';
import { FriendlyError } from '@/components/ui/friendly-error';
import { qk } from '@/lib/api/query-keys';
import { ReviewItem, type ReviewItemModel } from '@/components/business/review-item';
import {
  Star,
  MapPin,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Award,
  Clock,
  Languages,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

function getCoverStyle(coverImage?: string | null, slug?: string) {
  if (coverImage && coverImage.trim().length > 0) {
    if (coverImage.startsWith('linear') || coverImage.startsWith('http')) {
      return { background: coverImage };
    }
    return { background: coverImage };
  }
  const idx = slug ? slug.charCodeAt(0) % COVER_GRADIENTS.length : 0;
  return { background: COVER_GRADIENTS[idx] };
}

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

  const { data: professional, isLoading, isError } = useQuery({
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
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="container-wide -mt-20 relative z-10">
          <div className="flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full ring-8 ring-background" />
            <Skeleton className="mt-4 h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FriendlyError kind="professional" className="max-w-xl" />
      </div>
    );
  }

  const initials = professional.displayName
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const coverStyle = getCoverStyle(professional.coverImage, professional.slug);
  const hasSocialLinks = professional.website || professional.email || professional.phone;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Section */}
      <div
        className="relative h-56 w-full sm:h-72"
        style={coverStyle}
      >
        {professional.coverImage && professional.coverImage.startsWith('http') && (
          <SafeImage
            src={professional.coverImage}
            alt={`${professional.displayName} cover`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="container-wide -mt-24 relative z-10 pb-16">
        <div className="mx-auto max-w-3xl">
          {/* Avatar + Name Card */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-full ring-8 ring-background shadow-2xl bg-muted">
                {professional.avatar ? (
                  <SafeImage
                    src={professional.avatar}
                    alt={professional.displayName}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-4xl sm:text-5xl font-bold text-muted-foreground">
                    {initials}
                  </span>
                )}
              </div>
              {professional.verified && (
                <div className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-500 text-white shadow-lg">
                  <Award className="h-5 w-5" />
                </div>
              )}
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
              {professional.title && (
                <span className="text-muted-foreground">{professional.title} </span>
              )}
              {professional.displayName}
            </h1>

            <p className="mt-1 text-lg font-medium text-primary">
              {professional.profession}
            </p>

            {professional.headline && (
              <p className="mt-2 max-w-lg text-muted-foreground">
                {professional.headline}
              </p>
            )}

            {/* Rating */}
            {professional.ratingCount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.round(professional.ratingAverage)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-muted text-muted',
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">
                  {professional.ratingAverage.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({professional.ratingCount} review{professional.ratingCount === 1 ? '' : 's'})
                </span>
              </div>
            )}

            {/* Location */}
            {(professional.city || professional.country) && (
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {[professional.city, professional.state, professional.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href={`/submit-review?professionalId=${professional.id}` as never}>
                  <Star className="h-4 w-4" />
                  Write a Review
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </a>
              </Button>
            </div>
          </div>

          {/* Bio Section */}
          {professional.bio && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {professional.bio}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Experience */}
            {professional.yearsOfExperience != null && professional.yearsOfExperience > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Experience</h3>
                </div>
                <p className="text-2xl font-bold">
                  {professional.yearsOfExperience} year{professional.yearsOfExperience === 1 ? '' : 's'}
                </p>
              </div>
            )}

            {/* Languages */}
            {professional.languages.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {professional.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {professional.specialties.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Specialties</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {professional.specialties.map((s) => (
                    <Badge key={s} variant="outline" className="text-primary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Connect</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {professional.website && (
                    <a
                      href={professional.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Globe className="h-4 w-4 text-primary" />
                      {professional.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {professional.email && (
                    <a
                      href={`mailto:${professional.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                      {professional.email}
                    </a>
                  )}
                  {professional.phone && (
                    <a
                      href={`tel:${professional.phone}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      {professional.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
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
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                <Star className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No reviews yet. Be the first to share your experience.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
