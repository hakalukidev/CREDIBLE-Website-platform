import { prisma } from '../../lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const businessRepository = {
  create(data: Prisma.BusinessCreateInput) {
    return prisma.business.create({ data });
  },
  findById(id: string) {
    return prisma.business.findUnique({ where: { id } });
  },
  findBySlug(slug: string) {
    return prisma.business.findUnique({ where: { slug } });
  },
  findByOwner(ownerId: string) {
    return prisma.business.findUnique({ where: { ownerId } });
  },
  update(id: string, data: Prisma.BusinessUpdateInput) {
    return prisma.business.update({ where: { id }, data });
  },
  softDelete(id: string) {
    return prisma.business.update({ where: { id }, data: { deletedAt: new Date(), status: 'CLOSED' } });
  },
  async search(params: {
    q?: string;
    category?: string;
    city?: string;
    verifiedOnly?: boolean;
    minRating?: number;
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.BusinessWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      ...(params.verifiedOnly ? { verificationStatus: 'APPROVED' } : {}),
      ...(params.city ? { city: { equals: params.city, mode: 'insensitive' } } : {}),
      ...(params.minRating ? { ratingAverage: { gte: params.minRating } } : {}),
      ...(params.q
        ? {
            OR: [
              { displayName: { contains: params.q, mode: 'insensitive' } },
              { legalName: { contains: params.q, mode: 'insensitive' } },
              { description: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.category
        ? { category: { slug: params.category } }
        : {}),
    };

    const orderBy: Prisma.BusinessOrderByWithRelationInput = (() => {
      switch (params.sortBy) {
        case 'ratingAverage':
          return { ratingAverage: params.sortOrder };
        case 'ratingCount':
          return { ratingCount: params.sortOrder };
        case 'displayName':
          return { displayName: params.sortOrder };
        default:
          return { createdAt: params.sortOrder };
      }
    })();

    const [items, total] = await prisma.$transaction([
      prisma.business.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        select: {
          id: true,
          slug: true,
          displayName: true,
          logo: true,
          city: true,
          ratingAverage: true,
          ratingCount: true,
          verificationLevel: true,
          verificationStatus: true,
        },
      }),
      prisma.business.count({ where }),
    ]);

    return { items, total };
  },
  async recomputeRating(businessId: string) {
    const agg = await prisma.review.aggregate({
      where: { businessId, status: 'PUBLISHED' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return prisma.business.update({
      where: { id: businessId },
      data: {
        ratingAverage: agg._avg.rating ?? 0,
        ratingCount: agg._count._all,
      },
    });
  },
};
