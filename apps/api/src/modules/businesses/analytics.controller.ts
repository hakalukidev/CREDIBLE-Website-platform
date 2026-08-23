import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/db/prisma';
import { NotFoundError } from '../../lib/errors/AppError';
import { analyticsService } from '../../services/analyticsService';

async function requireOwnedBusiness(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new NotFoundError('Business profile');
  return business;
}

export const businessAnalyticsController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const range = analyticsService.parseRange(String(req.query.range ?? '30d'));
      const data = await analyticsService.getBusinessAnalytics(business.id, range);
      res.json({ success: true, data, meta: { range } });
    } catch (e) {
      next(e);
    }
  },

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const range = analyticsService.parseRange(String(req.query.range ?? '30d'));
      const csv = await analyticsService.exportBusinessAnalyticsCsv(business.id, range);
      res
        .type('text/csv')
        .setHeader(
          'Content-Disposition',
          `attachment; filename="credible-business-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
        )
        .send(csv);
    } catch (e) {
      next(e);
    }
  },
};