/**
 * Admin reviews service.
 *
 * Data-access layer for the moderation queue:
 *   - list reviews (filter by status / target / rating / search / date range)
 *   - get a single review with author, target, flags, and admin response
 *   - post / update an admin response
 *   - resolve a single flag (with auto-republish if last flag)
 *   - force a review into PUBLISHED / HIDDEN / PENDING_MODERATION
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db/prisma';

const REVIEW_WITH_RELATIONS = {
  user: {
    select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
  },
  business: { select: { id: true, slug: true, displayName: true } },
  professional: { select: { id: true, slug: true, displayName: true } },
  flags: {
    select: {
      id: true,
      reason: true,
      notes: true,
      flaggedById: true,
      flaggedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      resolvedAt: true,
      resolvedById: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  adminRespondedBy: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
} satisfies Prisma.ReviewInclude;

export const adminReviewsService = {
  async listReviews(filter: {
    status?: 'PUBLISHED' | 'FLAGGED' | 'HIDDEN' | 'DELETED' | 'PENDING_MODERATION';
    targetType?: 'BUSINESS' | 'PROFESSIONAL';
    search?: string;
    minRating?: number;
    maxRating?: number;
    from?: Date;
    to?: Date;
    page: number;
    perPage: number;
  }) {
    const where: Prisma.ReviewWhereInput = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.targetType) where.targetType = filter.targetType;
    if (filter.minRating !== undefined || filter.maxRating !== undefined) {
      where.rating = {
        ...(filter.minRating !== undefined ? { gte: filter.minRating } : {}),
        ...(filter.maxRating !== undefined ? { lte: filter.maxRating } : {}),
      };
    }
    if (filter.from || filter.to) {
      where.createdAt = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      };
    }
    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { content: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { business: { displayName: { contains: q, mode: 'insensitive' } } },
        { professional: { displayName: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: filter.perPage,
        include: REVIEW_WITH_RELATIONS,
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  },

  async getReview(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: REVIEW_WITH_RELATIONS,
    });
  },

  async respond(
    id: string,
    adminId: string,
    message: string,
  ) {
    return prisma.review.update({
      where: { id },
      data: {
        adminResponse: message,
        adminRespondedAt: new Date(),
        adminRespondedById: adminId,
      },
      include: REVIEW_WITH_RELATIONS,
    });
  },

  async resolveFlag(flagId: string, adminId: string, note?: string) {
    const flag = await prisma.reviewFlag.findUnique({ where: { id: flagId } });
    if (!flag) return null;

    await prisma.reviewFlag.update({
      where: { id: flagId },
      data: {
        resolvedAt: new Date(),
        resolvedById: adminId,
        notes: note ?? flag.notes,
      },
    });

    // Auto-republish: if all flags are resolved and the review was
    // PENDING_MODERATION, push it back to PUBLISHED.
    const remaining = await prisma.reviewFlag.count({
      where: { reviewId: flag.reviewId, resolvedAt: null },
    });
    if (remaining === 0) {
      const review = await prisma.review.findUnique({
        where: { id: flag.reviewId },
        select: { status: true, reportCount: true },
      });
      if (review?.status === 'PENDING_MODERATION') {
        await prisma.review.update({
          where: { id: flag.reviewId },
          data: { status: 'PUBLISHED' },
        });
      }
    }
    return this.getReview(flag.reviewId);
  },

  async forceStatus(
    id: string,
    status: 'PUBLISHED' | 'HIDDEN' | 'PENDING_MODERATION',
  ) {
    return prisma.review.update({
      where: { id },
      data: { status },
      include: REVIEW_WITH_RELATIONS,
    });
  },
};