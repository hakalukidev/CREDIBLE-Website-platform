import type { Request, Response, NextFunction } from 'express';
import { professionalService } from './professional.service';
import { normalizePagination, buildPaginationMeta } from '@credible/shared';
import { NotFoundError } from '../../lib/errors/AppError';

export const professionalController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await professionalService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await professionalService.update(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await professionalService.publish(req.user!.id, req.params.id as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await professionalService.getOwned(req.user!.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await professionalService.getBySlug(req.params.slug as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await professionalService.getById(req.params.id as string);
      if (!data) throw new NotFoundError('Professional');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, perPage, skip, take } = normalizePagination(req.query);
      const { q, profession, city, categoryId, verifiedOnly, minRating } = req.query as Record<string, string | undefined>;
      const { items, total } = await professionalService.search({
        q,
        profession,
        city,
        categoryId,
        verifiedOnly: verifiedOnly === 'true',
        minRating: minRating ? Number(minRating) : undefined,
        page,
        perPage,
        skip,
        take,
      });
      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },
};
