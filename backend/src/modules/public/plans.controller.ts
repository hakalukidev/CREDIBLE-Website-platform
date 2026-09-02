/**
 * Public plans controller.
 *
 * Returns the active subscription plans so that marketing pages
 * (e.g. /for-business) can render pricing from the database without
 * requiring an authenticated business owner.
 */

import type { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../../services/subscriptionService';

export const plansController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await subscriptionService.listPlans();
      // Plans change infrequently (admin action only) — let browsers and
      // CDNs cache the response for 5 minutes. This avoids a DB hit on
      // every page load of the public marketing pages.
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.json({ success: true, data: plans });
    } catch (e) {
      next(e);
    }
  },
};
