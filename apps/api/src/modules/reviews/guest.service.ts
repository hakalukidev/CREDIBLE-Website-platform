/**
 * Guest review submission — Phase 2.
 *
 * Lets an unauthenticated visitor submit a review for a business via a
 * 2-step OTP flow:
 *   1. POST /reviews/submit-otp     — generates a 6-digit code, queues an email.
 *   2. POST /reviews/guest          — verifies the OTP, auto-provisions a
 *                                    CUSTOMER user, and creates the review.
 *
 * Critical: the duplicate-review guard (`@@unique([userId, businessId])`) is
 * preserved — we re-use `reviewService.create` after provisioning the user.
 */
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../lib/errors/AppError';
import { hashOtp } from '@credible/shared/utils/crypto';
import { env, isDev } from '../../config/env';
import { authRepository } from '../auth/auth.repository';
import { businessRepository } from '../businesses/business.repository';
import { reviewRepository } from './review.repository';
import { queues } from '../../lib/queue/queues';
import { prisma } from '../../lib/db/prisma';
import { logger } from '../../lib/logger/logger';
import { DuplicateReviewError } from '../../lib/errors/AppError';
import type {
  SubmitReviewOtpInput,
  VerifyReviewOtpInput,
} from '@credible/shared';

function normalizeIdentifier(raw: string): { email?: string; phone?: string } {
  const trimmed = raw.trim();
  if (/@/.test(trimmed)) return { email: trimmed.toLowerCase() };
  return { phone: trimmed };
}

export const guestReviewService = {
  /**
   * Step 1 — request a verification code.
   * Identifies the reviewer by email OR phone. Returns `{ sent: true, devCode? }`.
   * The dev code is only returned in development environments.
   */
  async requestOtp(input: SubmitReviewOtpInput) {
    const business = await businessRepository.findById(input.businessId);
    if (!business || business.deletedAt) throw new NotFoundError('Business');
    if (business.status !== 'PUBLISHED') {
      throw new BadRequestError('This business is not accepting reviews yet');
    }

    const identifier = normalizeIdentifier(input.identifier);
    const code = String(
      Math.floor(Math.random() * (10 ** env.OTP_LENGTH - 1)) + 10 ** (env.OTP_LENGTH - 1),
    );
    const codeHash = hashOtp(code);

    await authRepository.createOtp({
      email: identifier.email,
      phone: identifier.phone,
      codeHash,
      purpose: 'review',
      expiresAt: new Date(Date.now() + env.OTP_EXPIRES_IN_SECONDS * 1000),
    });

    // Queue an email. If no SMTP is configured the worker will log a warning.
    await queues['send-email'].add('reviewOtp', {
      template: 'reviewOtpRequested',
      to: identifier.email ?? identifier.phone!,
      vars: {
        code,
        expiresInMinutes: Math.round(env.OTP_EXPIRES_IN_SECONDS / 60),
        businessName: business.displayName,
      },
    });

    logger.info(
      { businessId: business.id, hasEmail: Boolean(identifier.email) },
      'Review OTP requested',
    );

    return {
      sent: true,
      // Only return the code in development for testing convenience.
      devCode: isDev ? code : undefined,
    };
  },

  /**
   * Step 2 — verify the OTP and submit the review. Auto-provisions a
   * CUSTOMER user if one doesn't already exist for this identifier.
   */
  async verifyAndSubmit(input: VerifyReviewOtpInput) {
    const business = await businessRepository.findById(input.businessId);
    if (!business || business.deletedAt) throw new NotFoundError('Business');
    if (business.status !== 'PUBLISHED') {
      throw new BadRequestError('This business is not accepting reviews yet');
    }

    const identifier = normalizeIdentifier(input.identifier);

    // 1) Verify OTP — reuse the same low-level routine used by auth.verifyOtp.
    const otp = await authRepository.findActiveOtp(
      identifier.email,
      identifier.phone,
      'review',
    );
    if (!otp) throw new BadRequestError('Verification code expired. Request a new one.', 'OTP_INVALID');

    const { verifyOtp } = await import('@credible/shared');
    const valid = verifyOtp(input.code, otp.codeHash);
    if (!valid) {
      await authRepository.incrementOtpAttempts(otp.id);
      throw new BadRequestError('Incorrect verification code', 'OTP_INVALID');
    }
    await authRepository.consumeOtp(otp.id);

    // 2) Find or auto-provision a CUSTOMER user.
    const user = await this.findOrProvisionUser(identifier.email, identifier.phone);

    // 3) Reuse reviewService.create's logic inline so we get the same
    //    duplicate guard + side effects (rating recompute, notifications).
    const existing = await reviewRepository.findByUserAndBusiness(user.id, input.businessId);
    if (existing) throw new DuplicateReviewError();

    const editableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // REVIEW_EDIT_WINDOW_HOURS
    try {
      const review = await reviewRepository.create({
        business: { connect: { id: input.businessId } },
        user: { connect: { id: user.id } },
        rating: input.rating,
        title: input.title,
        content: input.content,
        editableUntil,
        status: 'PUBLISHED',
      });

      await queues['recompute-business-rating'].add('recompute', { businessId: input.businessId });
      await queues['review-notification'].add('review-submitted-thanks', { reviewId: review.id });

      return review;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new DuplicateReviewError();
      }
      throw err;
    }
  },

  /**
   * Pre-flight: has this email/phone already reviewed this business?
   * Returns `{ hasReviewed: boolean; reviewDate?: string }`.
   */
  async getReviewStatus(identifier: string, businessId: string) {
    const business = await businessRepository.findById(businessId);
    if (!business || business.deletedAt) throw new NotFoundError('Business');

    const norm = normalizeIdentifier(identifier);
    const user = norm.email
      ? await prisma.user.findUnique({ where: { email: norm.email } })
      : norm.phone
        ? await prisma.user.findUnique({ where: { phone: norm.phone } })
        : null;
    if (!user) return { hasReviewed: false };

    const review = await prisma.review.findFirst({
      where: { userId: user.id, businessId, deletedAt: null },
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