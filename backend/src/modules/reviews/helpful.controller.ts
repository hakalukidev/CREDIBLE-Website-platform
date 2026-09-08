import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../lib/errors/AppError';
import { prisma } from '../../lib/db/prisma';

/**
 * Helpful-vote endpoint.
 *
 * POST /reviews/:id/helpful — toggles a "this review was helpful" vote
 * for the authenticated user. The endpoint is idempotent: voting on
 * a review that's already been voted on by the same user is a no-op
 * and the current count is returned.
 *
 * Response shape: `{ success: true, data: { count: number, voted: boolean } }`.
 *
 * Why a join table instead of incrementing `Review.helpfulCount` directly:
 *  - Allows future "show helpful voters" UI without a schema migration.
 *  - Lets us identify and remove a vote (e.g. when a user unsubscribes).
 *  - The `@@unique([reviewId, userId])` constraint makes the toggle
 *    race-safe — duplicate inserts surface as P2002 and are caught.
 */
export const helpfulController = {
  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reviewId = req.params.id as string;

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true, deletedAt: true, helpfulCount: true },
      });
      if (!review || review.deletedAt) throw new NotFoundError('Review');

      const existing = await prisma.reviewHelpful.findUnique({
        where: { reviewId_userId: { reviewId, userId } },
      });

      let voted: boolean;
      if (existing) {
        // Toggle off — remove the vote and decrement the count.
        await prisma.$transaction([
          prisma.reviewHelpful.delete({
            where: { reviewId_userId: { reviewId, userId } },
          }),
          prisma.review.update({
            where: { id: reviewId },
            data: { helpfulCount: { decrement: 1 } },
          }),
        ]);
        voted = false;
      } else {
        // Toggle on — insert the vote and increment the count.
        try {
          await prisma.$transaction([
            prisma.reviewHelpful.create({ data: { reviewId, userId } }),
            prisma.review.update({
              where: { id: reviewId },
              data: { helpfulCount: { increment: 1 } },
            }),
          ]);
          voted = true;
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            // Race condition — another request created the same vote.
            // Treat as success with `voted: true`.
            voted = true;
          } else {
            throw err;
          }
        }
      }

      const fresh = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { helpfulCount: true },
      });

      res.json({
        success: true,
        data: { count: fresh?.helpfulCount ?? 0, voted },
      });
    } catch (e) {
      next(e);
    }
  },
};
