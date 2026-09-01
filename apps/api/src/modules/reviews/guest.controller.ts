import type { Request, Response, NextFunction } from 'express';
import { guestReviewService } from './guest.service';

export const guestReviewController = {
  async verifyAndSubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await guestReviewService.verifyAndSubmit(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getReviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, businessId, professionalId } = req.query as {
        identifier: string;
        businessId?: string;
        professionalId?: string;
      };
      const data = await guestReviewService.getReviewStatus(identifier, businessId, professionalId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};