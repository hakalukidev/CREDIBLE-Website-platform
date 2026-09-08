import type { Request, Response, NextFunction } from 'express';
import { businessService } from './business.service';
import { normalizePagination, buildPaginationMeta } from '@credible/shared';
import type { SearchBusinessesQuery } from '@credible/shared';
import { NotFoundError } from '../../lib/errors/AppError';

export const businessController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { business, user } = await businessService.create(req.user!.id, req.body);
      // Service returns `{ business, user }` so the frontend can refresh
      // its session store after the role upgrade without a second round
      // trip.
      res.status(201).json({ success: true, data: { business, user } });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessService.update(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessService.publish(req.user!.id, req.params.id as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessService.getOwned(req.user!.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessService.getBySlug(req.params.slug as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessService.getById(req.params.id as string);
      if (!data) throw new NotFoundError('Business');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, perPage, skip, take, sortBy, sortOrder } = normalizePagination(req.query);
      const { q, category, city, state, verifiedOnly, verificationLevel, minRating } = req.query as Record<string, string | undefined>;
      const { items, total } = await businessService.search({
        q,
        category,
        city,
        state,
        verifiedOnly: verifiedOnly === 'true',
        // Narrowed by `validate(searchBusinessesSchema, 'query')`.
        verificationLevel: verificationLevel as SearchBusinessesQuery['verificationLevel'],
        minRating: minRating ? Number(minRating) : undefined,
        sortBy: sortBy as SearchBusinessesQuery['sortBy'],
        sortOrder,
        skip,
        take,
      });
      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },
};