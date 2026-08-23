import { Prisma } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  DuplicateReviewError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors/AppError';
import { REVIEW_EDIT_WINDOW_HOURS } from '@credible/shared';
import type {
  CreateReviewInput,
  FlagReviewInput,
  ListReviewsInput,
  ReviewResponseInput,
  UpdateReviewInput,
} from '@credible/shared';
import { reviewRepository } from './review.repository';
import { businessRepository } from '../businesses/business.repository';
import { queues } from '../../lib/queue/queues';

export const reviewService = {
  async create(userId: string, input: CreateReviewInput) {
    const business = await businessRepository.findById(input.businessId);
    if (!business || business.deletedAt) throw new NotFoundError('Business');

    // CRITICAL rule: one review per user per business (enforced by DB unique index too)
    const existing = await reviewRepository.findByUserAndBusiness(userId, input.businessId);
    if (existing) throw new DuplicateReviewError();

    const editableUntil = new Date(Date.now() + REVIEW_EDIT_WINDOW_HOURS * 60 * 60 * 1000);

    try {
      const review = await reviewRepository.create({
        business: { connect: { id: input.businessId } },
        user: { connect: { id: userId } },
        rating: input.rating,
        title: input.title,
        content: input.content,
        editableUntil,
        status: 'PUBLISHED',
      });

      // Recompute rating in background
      await queues['recompute-business-rating'].add('recompute', { businessId: input.businessId });
      // Notify the reviewer.
      await queues['review-notification'].add('review-submitted-thanks', { reviewId: review.id });

      return review;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Race condition fallback
        throw new DuplicateReviewError();
      }
      throw err;
    }
  },

  async update(userId: string, reviewId: string, input: UpdateReviewInput) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.deletedAt) throw new NotFoundError('Review');
    if (review.userId !== userId) throw new ForbiddenError('You can only edit your own review');
    if (!review.editableUntil || review.editableUntil < new Date()) {
      throw new BadRequestError('The edit window has expired', 'EDIT_WINDOW_CLOSED');
    }
    return reviewRepository.update(reviewId, { ...input, editedAt: new Date() });
  },

  async getForViewer(userId: string, reviewId: string) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.deletedAt) throw new NotFoundError('Review');
    // Allow the reviewer (owner) or the business owner to view the detail.
    if (review.userId !== userId) {
      const business = await businessRepository.findById(review.businessId);
      if (!business || business.ownerId !== userId) {
        throw new ForbiddenError();
      }
    }
    return review;
  },

  async addBusinessResponse(
    ownerId: string,
    reviewId: string,
    input: ReviewResponseInput,
  ) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.deletedAt) throw new NotFoundError('Review');
    const business = await businessRepository.findById(review.businessId);
    if (!business || business.ownerId !== ownerId) throw new ForbiddenError();

    const updated = await reviewRepository.update(reviewId, {
      responseContent: input.content,
      responseAt: new Date(),
    });

    // Phase 2 — notify the original reviewer that the business replied.
    await queues['review-notification'].add('review-responded', {
      reviewId,
      responseContent: input.content,
    });

    return updated;
  },

  async flag(userId: string, reviewId: string, input: FlagReviewInput) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.deletedAt) throw new NotFoundError('Review');

    const already = await reviewRepository.findFlag(reviewId, userId);
    if (already) throw new ConflictError('You have already reported this review', 'ALREADY_FLAGGED');

    await reviewRepository.createFlag({
      review: { connect: { id: reviewId } },
      flaggedBy: { connect: { id: userId } },
      reason: input.reason,
      notes: input.notes,
    });

    // Mark review as flagged if multiple
    const count = await (
      await import('../../lib/db/prisma')
    ).prisma.reviewFlag.count({ where: { reviewId, resolvedAt: null } });

    if (count >= 3) {
      await reviewRepository.update(reviewId, {
        status: 'PENDING_MODERATION',
        reportCount: { increment: 1 },
      });
      await queues['moderate-review'].add('flagged', { reviewId });
    } else {
      await reviewRepository.update(reviewId, { reportCount: { increment: 1 } });
    }

    return { flagged: true };
  },

  async listForBusiness(businessId: string, query: ListReviewsInput & { skip: number; take: number }) {
    const business = await businessRepository.findById(businessId);
    if (!business || business.deletedAt) throw new NotFoundError('Business');
    return reviewRepository.listForBusiness({
      businessId,
      skip: query.skip,
      take: query.take,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder ?? 'desc',
      minRating: query.minRating,
      status: 'PUBLISHED',
    });
  },

  async listForUser(userId: string, query: { skip: number; take: number }) {
    return reviewRepository.listForUser({
      userId,
      skip: query.skip,
      take: query.take,
    });
  },
};