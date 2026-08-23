import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/db/prisma';

export const adminController = {
  async dashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const [users, businesses, reviews, pending, flagged] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.business.count({ where: { deletedAt: null } }),
        prisma.review.count({ where: { deletedAt: null } }),
        prisma.verificationApplication.count({
          where: {
            status: { in: ['PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED'] },
          },
        }),
        prisma.review.count({ where: { status: 'PENDING_MODERATION' } }),
      ]);

      const recentActivity = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json({
        success: true,
        data: {
          kpis: {
            totalUsers: users,
            totalBusinesses: businesses,
            totalReviews: reviews,
            pendingVerifications: pending,
            flaggedReviews: flagged,
          },
          recentActivity,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async listFlaggedReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await prisma.review.findMany({
        where: { status: 'PENDING_MODERATION' },
        include: { user: true, business: { select: { id: true, displayName: true } } },
        orderBy: { reportCount: 'desc' },
        take: 100,
      });
      res.json({ success: true, data: items });
    } catch (e) {
      next(e);
    }
  },

  async moderateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, notes } = req.body as { action: 'APPROVE' | 'REJECT' | 'DELETE'; notes?: string };
      const reviewId = req.params.reviewId as string;
      const newStatus = action === 'APPROVE' ? 'PUBLISHED' : action === 'REJECT' ? 'HIDDEN' : 'DELETED';
      const data = await prisma.review.update({
        where: { id: reviewId },
        data: { status: newStatus, ...(action === 'DELETE' ? { deletedAt: new Date() } : {}) },
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          action: `review.${action.toLowerCase()}`,
          target: reviewId,
          meta: { notes },
        },
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};