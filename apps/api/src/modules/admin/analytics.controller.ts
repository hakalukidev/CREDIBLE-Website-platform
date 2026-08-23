import type { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../../services/analyticsService';

export const adminAnalyticsController = {
  async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const range = analyticsService.parseRange(String(_req.query.range ?? '30d'));
      const data = await analyticsService.getAdminAnalytics(range);
      res.json({ success: true, data, meta: { range } });
    } catch (e) {
      next(e);
    }
  },

  async exportCsv(_req: Request, res: Response, next: NextFunction) {
    try {
      const range = analyticsService.parseRange(String(_req.query.range ?? '30d'));
      const csv = await analyticsService.exportAdminAnalyticsCsv(range);
      res
        .type('text/csv')
        .setHeader(
          'Content-Disposition',
          `attachment; filename="credible-admin-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
        )
        .send(csv);
    } catch (e) {
      next(e);
    }
  },
};