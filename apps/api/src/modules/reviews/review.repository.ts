import { prisma } from '../../lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const reviewRepository = {
  create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({ data });
  },

  update(id: string, data: Prisma.ReviewUpdateInput) {
    return prisma.review.update({ where: { id }, data });
  },

  findById(id: string) {
    return prisma.review.findUnique({ where: { id } });
  },

  /**
   * Find a review by (user, target, targetType) — for the
   * "one review per user per target" check. Backwards-compat shim:
   * if `targetType === 'BUSINESS'`, falls back to the legacy compound
   * unique on (userId, businessId) when present.
   */
  async findByUserAndTarget(
    userId: string,
    target: { type: 'BUSINESS' | 'PROFESSIONAL'; id: string },
  ) {
    if (target.type === 'BUSINESS') {
      // Legacy column still set; use the old unique index for performance.
      return prisma.review.findFirst({
        where: {
          userId,
          targetType: 'BUSINESS',
          businessId: target.id,
        },
      });
    }
    return prisma.review.findFirst({
      where: {
        userId,
        targetType: 'PROFESSIONAL',
        professionalId: target.id,
      },
    });
  },

  /**
   * @deprecated prefer `findByUserAndTarget`. Kept for legacy callers.
   */
  findByUserAndBusiness(userId: string, businessId: string) {
    return this.findByUserAndTarget(userId, { type: 'BUSINESS', id: businessId });
  },

  async listForBusiness(params: {
    businessId: string;
    skip: number;
    take: number;
    sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
    sortOrder: 'asc' | 'desc';
    minRating?: number;
    status?: 'PUBLISHED' | 'ALL';
  }) {
    const where: Prisma.ReviewWhereInput = {
      businessId: params.businessId,
      targetType: 'BUSINESS',
      deletedAt: null,
      ...(params.status === 'PUBLISHED' ? { status: 'PUBLISHED' } : {}),
      ...(params.minRating ? { rating: { gte: params.minRating } } : {}),
    };
    const orderBy: Prisma.ReviewOrderByWithRelationInput = (() => {
      switch (params.sortBy) {
        case 'rating':
          return { rating: params.sortOrder };
        case 'helpfulCount':
          return { helpfulCount: params.sortOrder };
        default:
          return { createdAt: params.sortOrder };
      }
    })();

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  },

  async listForProfessional(params: {
    professionalId: string;
    skip: number;
    take: number;
    sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
    sortOrder: 'asc' | 'desc';
    minRating?: number;
    status?: 'PUBLISHED' | 'ALL';
  }) {
    const where: Prisma.ReviewWhereInput = {
      professionalId: params.professionalId,
      targetType: 'PROFESSIONAL',
      deletedAt: null,
      ...(params.status === 'PUBLISHED' ? { status: 'PUBLISHED' } : {}),
      ...(params.minRating ? { rating: { gte: params.minRating } } : {}),
    };
    const orderBy: Prisma.ReviewOrderByWithRelationInput = (() => {
      switch (params.sortBy) {
        case 'rating':
          return { rating: params.sortOrder };
        case 'helpfulCount':
          return { helpfulCount: params.sortOrder };
        default:
          return { createdAt: params.sortOrder };
      }
    })();

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  },

  async listForUser(params: { userId: string; skip: number; take: number }) {
    const where: Prisma.ReviewWhereInput = {
      userId: params.userId,
      deletedAt: null,
    };
    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: {
          business: { select: { id: true, slug: true, displayName: true } },
          professional: { select: { id: true, slug: true, displayName: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  },

  async createFlag(data: Prisma.ReviewFlagCreateInput) {
    return prisma.reviewFlag.create({ data });
  },

  findFlag(reviewId: string, userId: string) {
    return prisma.reviewFlag.findUnique({
      where: { reviewId_flaggedById: { reviewId, flaggedById: userId } },
    });
  },
};
