import { prisma, type DbClient } from '../../lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const professionalRepository = {
  create(data: Prisma.ProfessionalCreateInput, client: DbClient = prisma) {
    return client.professional.create({ data });
  },
  findById(id: string, client: DbClient = prisma) {
    return client.professional.findUnique({ where: { id } });
  },
  findBySlug(slug: string, client: DbClient = prisma) {
    return client.professional.findUnique({ where: { slug } });
  },
  findByOwner(ownerId: string, client: DbClient = prisma) {
    return client.professional.findUnique({ where: { ownerId } });
  },
  update(id: string, data: Prisma.ProfessionalUpdateInput, client: DbClient = prisma) {
    return client.professional.update({ where: { id }, data });
  },
  softDelete(id: string, client: DbClient = prisma) {
    return client.professional.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });
  },
  async search(params: {
    q?: string;
    profession?: string;
    city?: string;
    categoryId?: string;
    verifiedOnly?: boolean;
    minRating?: number;
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.ProfessionalWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      ...(params.verifiedOnly ? { verificationStatus: 'APPROVED' } : {}),
      ...(params.city ? { city: { equals: params.city, mode: 'insensitive' } } : {}),
      ...(params.minRating ? { ratingAverage: { gte: params.minRating } } : {}),
      ...(params.q
        ? {
            OR: [
              { displayName: { contains: params.q, mode: 'insensitive' } },
              { headline: { contains: params.q, mode: 'insensitive' } },
              { bio: { contains: params.q, mode: 'insensitive' } },
              { profession: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.profession ? { profession: { equals: params.profession, mode: 'insensitive' } } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    };

    const orderBy: Prisma.ProfessionalOrderByWithRelationInput = (() => {
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
      prisma.professional.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        select: {
          id: true,
          slug: true,
          displayName: true,
          profession: true,
          headline: true,
          avatar: true,
          coverImage: true,
          city: true,
          country: true,
          ratingAverage: true,
          ratingCount: true,
          verificationLevel: true,
          verificationStatus: true,
        },
      }),
      prisma.professional.count({ where }),
    ]);

    return { items, total };
  },
};
