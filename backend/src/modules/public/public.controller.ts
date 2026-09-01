import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import {
  getBadge,
  getTrustScore,
  getWidgetData,
  listReviewsForPublic,
  logWidgetImpression,
  resolveBusiness,
  toSummary,
} from './public.service';

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulCount']).default('createdAt'),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

function hashIp(ip?: string) {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/** Express 5 types params as `string | string[]` — collapse to a single string. */
function param(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

export const publicController = {
  async getBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await resolveBusiness(param(req, 'slugOrId'));
      res.json({ success: true, data: toSummary(business) });
    } catch (e) {
      next(e);
    }
  },

  async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await resolveBusiness(param(req, 'slugOrId'));
      // `validate()` middleware has coerced/assigned the parsed query onto req.query
      const q = req.query as unknown as ListReviewsQuery;
      const { items, total } = await listReviewsForPublic(business.id, {
        page: q.page,
        perPage: q.perPage,
        sortBy: q.sortBy,
      });
      res.json({
        success: true,
        data: items,
        meta: {
          page: q.page,
          perPage: q.perPage,
          total,
          totalPages: Math.ceil(total / q.perPage),
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async getTrustScore(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await resolveBusiness(param(req, 'slugOrId'));
      const data = await getTrustScore(business.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getBadge(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await resolveBusiness(param(req, 'slugOrId'));
      const data = await getBadge(business.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getWidget(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await resolveBusiness(param(req, 'slugOrId'));
      const data = await getWidgetData(business.id);
      // Log the impression (fire-and-forget)
      logWidgetImpression({
        businessId: business.id,
        widgetType: 'combined',
        referrer: req.header('referer') ?? undefined,
        userAgent: req.header('user-agent') ?? undefined,
        ipHash: hashIp(req.ip),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async logWidgetEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await resolveBusiness(param(req, 'slugOrId'));
      const widgetType = String(req.body?.widgetType ?? 'unknown').slice(0, 32);
      logWidgetImpression({
        businessId: business.id,
        widgetType,
        referrer: req.header('referer') ?? undefined,
        userAgent: req.header('user-agent') ?? undefined,
        ipHash: hashIp(req.ip),
      });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
};