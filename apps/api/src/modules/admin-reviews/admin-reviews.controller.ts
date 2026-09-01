/**
 * Admin reviews controller.
 *
 * Thin HTTP layer over `adminReviewsService` — every mutation writes an
 * audit log entry so the moderation activity is traceable.
 */
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  adminRespondReviewSchema,
  adminResolveReviewFlagSchema,
  adminForceReviewStatusSchema,
} from '@credible/shared';
import { adminReviewsService } from './admin-reviews.service';
import { audit } from '../../lib/audit/log';
import { NotFoundError } from '../../lib/errors/AppError';

const paramsId = z.object({ id: z.string().min(1) });
const paramsFlag = z.object({
  reviewId: z.string().min(1),
  flagId: z.string().min(1),
});

export const adminReviewsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        status?: string;
        targetType?: string;
        search?: string;
        minRating?: string;
        maxRating?: string;
        from?: string;
        to?: string;
        page?: string;
        perPage?: string;
      };
      const data = await adminReviewsService.listReviews({
        status: q.status as never,
        targetType: q.targetType as never,
        search: q.search,
        minRating: q.minRating ? Number(q.minRating) : undefined,
        maxRating: q.maxRating ? Number(q.maxRating) : undefined,
        from: q.from ? new Date(q.from) : undefined,
        to: q.to ? new Date(q.to) : undefined,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminReviewsService.getReview(id);
      if (!data) throw new NotFoundError('Review');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const { message } = adminRespondReviewSchema.parse(req.body);
      const data = await adminReviewsService.respond(id, req.user!.id, message);
      await audit({
        actorId: req.user!.id,
        action: 'admin.review.respond',
        target: id,
        meta: { message } as Prisma.InputJsonValue,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async resolveFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId, flagId } = paramsFlag.parse(req.params);
      const { note } = adminResolveReviewFlagSchema.parse(req.body ?? {});
      const data = await adminReviewsService.resolveFlag(flagId, req.user!.id, note);
      if (!data) throw new NotFoundError('ReviewFlag');
      await audit({
        actorId: req.user!.id,
        action: 'admin.review.flag.resolve',
        target: reviewId,
        meta: { flagId, note } as Prisma.InputJsonValue,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async forceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const input = adminForceReviewStatusSchema.parse(req.body);
      const data = await adminReviewsService.forceStatus(id, input.status);
      if (!data) throw new NotFoundError('Review');
      await audit({
        actorId: req.user!.id,
        action: 'admin.review.status',
        target: id,
        meta: { status: input.status, reason: input.reason } as Prisma.InputJsonValue,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};