/**
 * Phase 2 — Owner-facing endpoints for the authenticated business.
 *
 *   GET    /businesses/me/profile           — current owner's profile
 *   PATCH  /businesses/me/profile           — update profile (extended schema)
 *   GET    /businesses/me/reviews           — paginated list of reviews
 *   GET    /businesses/me/reviews/:id       — single review
 *   POST   /businesses/me/reviews/:id/respond
 *   POST   /businesses/me/reviews/:id/report
 *   POST   /businesses/me/invite            — email invitation
 *   GET    /businesses/me/qr-code           — SVG/PNG QR
 */
import type { Request, Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import { buildPaginationMeta, normalizePagination } from '@credible/shared';
import { businessService } from './business.service';
import { businessRepository } from './business.repository';
import { reviewService } from '../reviews/review.service';
import { prisma } from '../../lib/db/prisma';
import { NotFoundError } from '../../lib/errors/AppError';
import { queues } from '../../lib/queue/queues';
import { env } from '../../config/env';
import type { OwnerReviewListInput } from '@credible/shared';

async function requireOwnedBusiness(ownerId: string) {
  const business = await businessRepository.findByOwner(ownerId);
  if (!business) throw new NotFoundError('Business');
  return business;
}

export const meController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      res.json({ success: true, data: business });
    } catch (e) {
      next(e);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const data = await businessService.updateProfile(req.user!.id, business.id, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const { page, perPage, skip, take, sortBy, sortOrder } = normalizePagination(req.query);
      const { minRating, search } = req.query as {
        minRating?: string;
        search?: string;
      };

      const where = {
        businessId: business.id,
        deletedAt: null,
        ...(minRating ? { rating: { gte: Number(minRating) } } : {}),
        ...(search
          ? {
              OR: [
                { content: { contains: search, mode: 'insensitive' as const } },
                { title: { contains: search, mode: 'insensitive' as const } },
                { user: { is: { firstName: { contains: search, mode: 'insensitive' as const } } } },
              ],
            }
          : {}),
      };

      const [items, total] = await prisma.$transaction([
        prisma.review.findMany({
          where,
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy:
            sortBy === 'rating'
              ? { rating: sortOrder }
              : sortBy === 'helpfulCount'
                ? { helpfulCount: sortOrder }
                : { createdAt: sortOrder },
          skip,
          take,
        }),
        prisma.review.count({ where }),
      ]);

      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },

  async getReview(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const review = await prisma.review.findFirst({
        where: { id: req.params.reviewId as string, businessId: business.id, deletedAt: null },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      });
      if (!review) throw new NotFoundError('Review');
      res.json({ success: true, data: review });
    } catch (e) {
      next(e);
    }
  },

  async respondReview(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      // Reuse the existing service — it enforces ownership via the review's business.
      const data = await reviewService.addBusinessResponse(req.user!.id, req.params.reviewId as string, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async reportReview(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      // Make sure the review belongs to this business before flagging.
      const review = await prisma.review.findFirst({
        where: { id: req.params.reviewId as string, businessId: business.id },
      });
      if (!review) throw new NotFoundError('Review');
      const data = await reviewService.flag(req.user!.id, req.params.reviewId as string, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const { customerEmail, customerName, message } = req.body as {
        customerEmail: string;
        customerName?: string;
        message?: string;
      };
      const reviewLink = `${env.WEB_URL}/submit-review/${business.id}`;
      await queues['send-email'].add('invite', {
        template: 'reviewInvitationRequested',
        to: customerEmail,
        vars: {
          customerName,
          businessName: business.displayName,
          inviterName: business.displayName,
          message,
          reviewLink,
        },
      });
      res.json({ success: true, data: { sent: true } });
    } catch (e) {
      next(e);
    }
  },

  async qrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await requireOwnedBusiness(req.user!.id);
      const format = (req.query.format as 'svg' | 'png') ?? 'svg';
      const url = `${env.WEB_URL}/submit-review/${business.id}`;

      if (format === 'png') {
        const buf = await QRCode.toBuffer(url, { type: 'png', width: 512, margin: 2 });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="credible-qr-${business.slug}.png"`);
        return res.send(buf);
      }

      const svg = await QRCode.toString(url, {
        type: 'svg',
        margin: 2,
        width: 512,
        color: { dark: '#111827', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `inline; filename="credible-qr-${business.slug}.svg"`);
      return res.send(svg);
    } catch (e) {
      next(e);
      return;
    }
  },
};