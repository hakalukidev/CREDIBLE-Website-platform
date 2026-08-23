import { prisma } from '../../lib/db/prisma';
import { NotFoundError } from '../../lib/errors/AppError';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://credible.com';

export interface PublicBusinessSummary {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  category?: string;
  city?: string;
  country?: string;
  isVerified: boolean;
  verificationLevel: string;
  averageRating: number;
  totalReviews: number;
  profileUrl: string;
  verificationUrl?: string;
}

/**
 * Resolve a business by either its slug (preferred) or its id.
 */
export async function resolveBusiness(slugOrId: string) {
  const business = await prisma.business.findFirst({
    where: {
      OR: [{ slug: slugOrId }, { id: slugOrId }],
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      displayName: true,
      description: true,
      logo: true,
      city: true,
      country: true,
      ratingAverage: true,
      ratingCount: true,
      verificationStatus: true,
      verificationLevel: true,
      badgeHash: true,
      category: { select: { name: true, slug: true } },
    },
  });
  if (!business) throw new NotFoundError('Business');
  return business;
}

export function toSummary(b: Awaited<ReturnType<typeof resolveBusiness>>): PublicBusinessSummary {
  const isVerified = b.verificationStatus === 'APPROVED' && b.verificationLevel !== 'NONE';
  return {
    id: b.id,
    slug: b.slug,
    name: b.displayName,
    description: b.description ?? undefined,
    logo: b.logo ?? undefined,
    category: b.category?.name,
    city: b.city ?? undefined,
    country: b.country ?? undefined,
    isVerified,
    verificationLevel: b.verificationLevel,
    averageRating: Number(b.ratingAverage ?? 0),
    totalReviews: b.ratingCount,
    profileUrl: `${SITE_URL}/business/${b.slug}`,
    verificationUrl: b.badgeHash ? `${SITE_URL}/verify/${b.badgeHash}` : undefined,
  };
}

export async function listReviewsForPublic(
  businessId: string,
  opts: { page: number; perPage: number; sortBy?: 'createdAt' | 'rating' | 'helpfulCount' },
) {
  const orderBy =
    opts.sortBy === 'rating'
      ? { rating: 'desc' as const }
      : opts.sortBy === 'helpfulCount'
        ? { helpfulCount: 'desc' as const }
        : { createdAt: 'desc' as const };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { businessId, status: 'PUBLISHED', deletedAt: null },
      orderBy,
      skip: (opts.page - 1) * opts.perPage,
      take: opts.perPage,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        helpfulCount: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
        responseContent: true,
        responseAt: true,
      },
    }),
    prisma.review.count({
      where: { businessId, status: 'PUBLISHED', deletedAt: null },
    }),
  ]);
  return {
    items: items.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title ?? undefined,
      comment: r.content,
      helpfulCount: r.helpfulCount,
      customerName:
        [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || 'Anonymous',
      createdAt: r.createdAt.toISOString(),
      response: r.responseContent
        ? { content: r.responseContent, at: r.responseAt!.toISOString() }
        : undefined,
    })),
    total,
  };
}

/**
 * Trust score = a deterministic blend of review count, average rating,
 * verification status, and engagement (helpful counts + owner responses).
 *
 * Returns 0-100 plus a friendly label.
 */
export async function getTrustScore(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      ratingAverage: true,
      ratingCount: true,
      verificationStatus: true,
      verificationLevel: true,
    },
  });
  if (!business) throw new NotFoundError('Business');

  const [helpfulTotal, reviewsWithResponse] = await Promise.all([
    prisma.review.aggregate({
      _sum: { helpfulCount: true },
      where: { businessId, status: 'PUBLISHED' },
    }),
    prisma.review.count({
      where: { businessId, status: 'PUBLISHED', responseContent: { not: null } },
    }),
  ]);

  const reviewCount = business.ratingCount;
  const avg = Number(business.ratingAverage ?? 0);
  const reviewScore = Math.min(40, Math.round((avg / 5) * 30 + Math.log10(Math.max(1, reviewCount)) * 4));
  const verificationScore =
    business.verificationStatus === 'APPROVED'
      ? business.verificationLevel === 'PREMIUM'
        ? 25
        : business.verificationLevel === 'CERTIFIED'
          ? 20
          : business.verificationLevel === 'BASIC'
            ? 15
            : 10
      : 0;
  const responseScore = reviewCount > 0 ? Math.min(20, Math.round((reviewsWithResponse / reviewCount) * 20)) : 0;
  const engagementScore = Math.min(15, Math.round(((helpfulTotal._sum.helpfulCount ?? 0) / Math.max(1, reviewCount)) * 3));

  const total = Math.min(100, reviewScore + verificationScore + responseScore + engagementScore);
  return {
    score: total,
    rating: total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Average' : 'Needs Improvement',
    reviewCount,
    isVerified: business.verificationStatus === 'APPROVED',
    responseRate: reviewCount > 0 ? Math.round((reviewsWithResponse / reviewCount) * 100) : 0,
    components: {
      reviewScore,
      verificationScore,
      responseScore,
      engagementScore,
    },
  };
}

export async function getBadge(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { badgeHash: true, verificationStatus: true, verificationLevel: true, slug: true, displayName: true },
  });
  if (!business) throw new NotFoundError('Business');
  const hasBadge = Boolean(business.badgeHash) && business.verificationStatus === 'APPROVED';
  return {
    hasBadge,
    badgeType: business.verificationLevel === 'PREMIUM' ? 'PREMIUM' : business.verificationLevel === 'CERTIFIED' ? 'CERTIFIED' : 'VERIFIED',
    verificationUrl: business.badgeHash ? `${SITE_URL}/verify/${business.badgeHash}` : undefined,
    businessName: business.displayName,
    businessSlug: business.slug,
  };
}

export async function getWidgetData(businessId: string) {
  const summary = toSummary(await resolveBusiness(businessId));
  const { items } = await listReviewsForPublic(businessId, { page: 1, perPage: 5, sortBy: 'helpfulCount' });
  const trust = await getTrustScore(businessId);
  return { business: summary, reviews: items, trust };
}

/**
 * Log a widget impression — fire-and-forget. Called from any public endpoint
 * the widget script hits.
 */
export function logWidgetImpression(input: {
  businessId: string;
  widgetType: string;
  referrer?: string;
  userAgent?: string;
  ipHash?: string;
}) {
  return prisma.widgetImpression
    .create({
      data: {
        businessId: input.businessId,
        widgetType: input.widgetType,
        referrer: input.referrer?.slice(0, 1024),
        userAgent: input.userAgent?.slice(0, 1024),
        ipHash: input.ipHash,
      },
    })
    .catch(() => undefined);
}