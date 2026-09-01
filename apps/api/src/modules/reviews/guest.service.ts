/**
 * Guest review submission.
 *
 * Lets an unauthenticated visitor submit a review for a business or
 * professional without any OTP / verification round-trip:
 *   1. POST /reviews/guest    — auto-provisions a CUSTOMER user (if needed)
 *                              and creates the review.
 *
 * Critical: the duplicate-review guard (`@@unique([userId, targetType, targetId])`)
 * is preserved — we re-use `reviewService.create`'s shape after provisioning.
 *
 * (OTP verification was removed per product decision. Reviewers still provide
 * an identifier (email or phone) so we can deduplicate across submissions
 * from the same person.)
 */
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../lib/errors/AppError';
import { businessRepository } from '../businesses/business.repository';
import { reviewRepository } from './review.repository';
import { queues } from '../../lib/queue/queues';
import { prisma } from '../../lib/db/prisma';
import { logger } from '../../lib/logger/logger';
import { DuplicateReviewError } from '../../lib/errors/AppError';
import type {
  VerifyReviewOtpInput,
} from '@credible/shared';

function normalizeIdentifier(raw: string): { email?: string; phone?: string } {
  const trimmed = raw.trim();
  if (/@/.test(trimmed)) return { email: trimmed.toLowerCase() };
  return { phone: trimmed };
}

export const guestReviewService = {
  /**
   * Submit a guest review for a business or professional. No OTP, no signup.
   * The user is identified by email or phone — if no account exists for that
   * identifier, we auto-provision a `CUSTOMER` user so the review is tied to
   * a real `userId` (preserves the duplicate guard and rating aggregates).
   */
  async verifyAndSubmit(input: VerifyReviewOtpInput) {
    const businessId = input.businessId;
    const professionalId = input.professionalId;
    const targetType: 'BUSINESS' | 'PROFESSIONAL' = businessId ? 'BUSINESS' : 'PROFESSIONAL';
    const targetId = (businessId ?? professionalId)!;

    if (targetType === 'BUSINESS') {
      const business = await businessRepository.findById(targetId);
      if (!business || business.deletedAt) throw new NotFoundError('Business');
      if (business.status !== 'PUBLISHED') {
        throw new BadRequestError('This business is not accepting reviews yet');
      }
    } else {
      const professional = await prisma.professional.findUnique({ where: { id: targetId } });
      if (!professional || professional.deletedAt) throw new NotFoundError('Professional');
      if (professional.status !== 'PUBLISHED') {
        throw new BadRequestError('This professional is not accepting reviews yet');
      }
    }

    const identifier = normalizeIdentifier(input.identifier);

    // 1) Find or auto-provision a CUSTOMER user for this identifier.
    const user = await this.findOrProvisionUser(identifier.email, identifier.phone);

    // 2) Reuse the existing duplicate guard + side effects.
    const existing = await reviewRepository.findByUserAndTarget(user.id, {
      type: targetType,
      id: targetId,
    });
    if (existing) throw new DuplicateReviewError();

    const editableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // REVIEW_EDIT_WINDOW_HOURS
    try {
      const review = await reviewRepository.create({
        targetType,
        business: targetType === 'BUSINESS' ? { connect: { id: targetId } } : undefined,
        professional: targetType === 'PROFESSIONAL' ? { connect: { id: targetId } } : undefined,
        user: { connect: { id: user.id } },
        rating: input.rating,
        title: input.title,
        content: input.content,
        editableUntil,
        status: 'PUBLISHED',
      });

      await queues['recompute-business-rating'].add('recompute', {
        businessId: targetType === 'BUSINESS' ? targetId : undefined,
        professionalId: targetType === 'PROFESSIONAL' ? targetId : undefined,
      });
      await queues['review-notification'].add('review-submitted-thanks', { reviewId: review.id });

      logger.info(
        { reviewId: review.id, targetType, targetId, userId: user.id },
        'Guest review submitted (no OTP)',
      );

      return review;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new DuplicateReviewError();
      }
      throw err;
    }
  },

  /**
   * Pre-flight: has this email/phone already reviewed this target?
   * Returns `{ hasReviewed: boolean; reviewDate?: string }`.
   */
  async getReviewStatus(identifier: string, businessId?: string, professionalId?: string) {
    if (!businessId && !professionalId) {
      throw new BadRequestError('Either businessId or professionalId is required');
    }
    if (businessId) {
      const business = await businessRepository.findById(businessId);
      if (!business || business.deletedAt) throw new NotFoundError('Business');
    } else if (professionalId) {
      const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
      if (!professional || professional.deletedAt) throw new NotFoundError('Professional');
    }

    const norm = normalizeIdentifier(identifier);
    const user = norm.email
      ? await prisma.user.findUnique({ where: { email: norm.email } })
      : norm.phone
        ? await prisma.user.findUnique({ where: { phone: norm.phone } })
        : null;
    if (!user) return { hasReviewed: false };

    const review = await prisma.review.findFirst({
      where: {
        userId: user.id,
        businessId,
        professionalId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!review) return { hasReviewed: false };

    return {
      hasReviewed: true,
      reviewId: review.id,
      reviewDate: review.createdAt.toISOString(),
      rating: review.rating,
    };
  },

  async findOrProvisionUser(email?: string, phone?: string) {
    if (!email && !phone) {
      throw new BadRequestError('Email or phone is required');
    }
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return existing;
      return prisma.user.create({
        data: {
          email,
          role: 'CUSTOMER',
          emailVerifiedAt: new Date(),
        },
      });
    }
    // phone path
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return existing;
    // Need a unique email-like placeholder. Use phone@credible.local so the
    // unique constraint is satisfied even when the user only gave us a phone.
    const placeholderEmail = `${phone?.replace(/[^0-9]/g, '')}@phone.credible.local`;
    return prisma.user.create({
      data: {
        email: placeholderEmail,
        phone,
        role: 'CUSTOMER',
        phoneVerifiedAt: new Date(),
      },
    });
  },
};