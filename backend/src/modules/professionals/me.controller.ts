import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/db/prisma';
import { professionalService } from './professional.service';
import { buildPaginationMeta, normalizePagination } from '@credible/shared';
import { NotFoundError } from '../../lib/errors/AppError';

/**
 * Owner-scoped "me" routes for professionals — mirrors businesses/me.controller.ts.
 * Uses the owner's profile as the source of truth.
 */
export const meProfessionalController = {
  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.id;
      const profile = await prisma.professional.findUnique({ where: { ownerId } });
      if (!profile) throw new NotFoundError('Professional profile not found');
      res.json({ success: true, data: profile });
    } catch (e) {
      next(e);
    }
  },

  async updateMine(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.id;
      const profile = await prisma.professional.findUnique({ where: { ownerId } });
      if (!profile) throw new NotFoundError('Professional profile not found');
      const data = await professionalService.update(ownerId, profile.id, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async publishMine(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.id;
      const profile = await prisma.professional.findUnique({ where: { ownerId } });
      if (!profile) throw new NotFoundError('Professional profile not found');
      const data = await professionalService.publish(ownerId, profile.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /professionals/me/reviews — paginated reviews for the owner's profile.
   * Mirrors /businesses/me/reviews so the same ReviewItem UI works.
   */
  async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.id;
      const profile = await prisma.professional.findUnique({ where: { ownerId } });
      if (!profile) throw new NotFoundError('Professional profile not found');

      const { page, perPage, skip, take, sortBy, sortOrder } = normalizePagination(req.query);
      const { minRating, search } = req.query as {
        minRating?: string;
        search?: string;
      };

      const where = {
        professionalId: profile.id,
        deletedAt: null,
        ...(minRating ? { rating: { gte: Number(minRating) } } : {}),
        ...(search
          ? {
              OR: [
                { content: { contains: search, mode: 'insensitive' as const } },
                { title: { contains: search, mode: 'insensitive' as const } },
                { user: { is: { firstName: { contains: search, mode: 'insensitive' as const } } } },
              ],
            }
          : {}),
      };

      const [items, total] = await prisma.$transaction([
        prisma.review.findMany({
          where,
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy:
            sortBy === 'rating'
              ? { rating: sortOrder }
              : sortBy === 'helpfulCount'
                ? { helpfulCount: sortOrder }
                : { createdAt: sortOrder },
          skip,
          take,
        }),
        prisma.review.count({ where }),
      ]);

      res.json({
        success: true,
        data: items,
        meta: buildPaginationMeta(total, page, perPage),
      });
    } catch (e) {
      next(e);
    }
  },
};
