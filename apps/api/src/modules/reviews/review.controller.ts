import type { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service';
import { buildPaginationMeta, normalizePagination, reviewResponseSchema } from '@credible/shared';

export const reviewController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.update(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.addBusinessResponse(
        req.user!.id,
        req.params.id as string,
        reviewResponseSchema.parse(req.body),
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async flag(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.flag(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async listForBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, perPage, skip, take, sortBy, sortOrder } = normalizePagination(req.query);
      const { minRating } = req.query as { minRating?: string };
      const { items, total } = await reviewService.listForBusiness(req.params.businessId as string, {
        skip,
        take,
        sortBy: sortBy as 'createdAt' | 'rating' | 'helpfulCount' | undefined,
        sortOrder,
        minRating: minRating ? Number(minRating) : undefined,
      });
      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, perPage, skip, take } = normalizePagination(req.query);
      const { items, total } = await reviewService.listForUser(req.user!.id, { skip, take });
      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.getForViewer(req.user!.id, req.params.id as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};