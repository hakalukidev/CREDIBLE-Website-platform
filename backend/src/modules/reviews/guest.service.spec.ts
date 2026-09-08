import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock heavy modules before importing the service.
vi.mock('../../lib/db/prisma', () => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    review: {
      findFirst: vi.fn(),
    },
  };
  return { prisma: prismaMock };
});

vi.mock('../../lib/queue/queues', () => ({
  queues: {
    'send-email': { add: vi.fn().mockResolvedValue(undefined) },
    'recompute-business-rating': { add: vi.fn().mockResolvedValue(undefined) },
    'review-notification': { add: vi.fn().mockResolvedValue(undefined) },
  },
}));

vi.mock('../../lib/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../auth/auth.repository', () => ({
  authRepository: {
    // No OTP calls anymore — left here only to surface accidental regressions.
    createOtp: vi.fn(),
    findActiveOtp: vi.fn(),
    incrementOtpAttempts: vi.fn(),
    consumeOtp: vi.fn(),
  },
}));

vi.mock('../businesses/business.repository', () => ({
  businessRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('./review.repository', () => ({
  reviewRepository: {
    findByUserAndBusiness: vi.fn(),
    findByUserAndTarget: vi.fn(),
    create: vi.fn(),
  },
}));

import { prisma } from '../../lib/db/prisma';
import { authRepository } from '../auth/auth.repository';
import { businessRepository } from '../businesses/business.repository';
import { reviewRepository } from './review.repository';
import { queues } from '../../lib/queue/queues';
import { guestReviewService } from './guest.service';
import { DuplicateReviewError, NotFoundError, BadRequestError } from '../../lib/errors/AppError';

const prismaMock = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  review: { findFirst: ReturnType<typeof vi.fn> };
};

const publishedBusiness = {
  id: 'biz_123',
  displayName: 'Acme',
  status: 'PUBLISHED',
  ownerId: 'owner_1',
  deletedAt: null,
} as any;

describe('guestReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyAndSubmit (no OTP)', () => {
    const baseInput = {
      businessId: 'biz_123',
      identifier: 'guest@example.com',
      rating: 5,
      content: 'Absolutely loved it — clean, fast, friendly service.',
    };

    it('refuses un-published businesses', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...publishedBusiness,
        status: 'DRAFT',
      });
      await expect(
        guestReviewService.verifyAndSubmit(baseInput as any),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('throws NotFound when the business is missing', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        guestReviewService.verifyAndSubmit(baseInput as any),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('provisions a new user and creates the review without any OTP step', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user_new',
        email: 'guest@example.com',
        role: 'CUSTOMER',
      });
      (reviewRepository.findByUserAndTarget as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (reviewRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'review_1',
        rating: 5,
      });

      const review = await guestReviewService.verifyAndSubmit(baseInput as any);
      expect(review).toMatchObject({ id: 'review_1', rating: 5 });
      expect(prismaMock.user.create).toHaveBeenCalledOnce();
      expect(reviewRepository.create).toHaveBeenCalledOnce();
      expect(queues['recompute-business-rating'].add).toHaveBeenCalled();
      expect(queues['review-notification'].add).toHaveBeenCalledWith(
        'review-submitted-thanks',
        expect.objectContaining({ reviewId: 'review_1' }),
      );

      // No OTP writes/reads should ever happen.
      expect(authRepository.createOtp).not.toHaveBeenCalled();
      expect(authRepository.findActiveOtp).not.toHaveBeenCalled();
      expect(authRepository.consumeOtp).not.toHaveBeenCalled();
    });

    it('throws DuplicateReviewError if a review already exists', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user_existing' });
      (reviewRepository.findByUserAndTarget as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'review_existing',
      });

      await expect(
        guestReviewService.verifyAndSubmit(baseInput as any),
      ).rejects.toBeInstanceOf(DuplicateReviewError);
      expect(reviewRepository.create).not.toHaveBeenCalled();
    });
  });
});