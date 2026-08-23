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
import { hashOtp } from '@credible/shared/utils/crypto';

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

  describe('requestOtp', () => {
    it('persists a hashed OTP and queues an email for a valid identifier', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      (authRepository.createOtp as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await guestReviewService.requestOtp({
        businessId: 'biz_123',
        identifier: 'guest@example.com',
      });

      expect(result.sent).toBe(true);
      expect(authRepository.createOtp).toHaveBeenCalledOnce();
      const createArgs = (authRepository.createOtp as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(createArgs.purpose).toBe('review');
      expect(createArgs.email).toBe('guest@example.com');
      expect(typeof createArgs.codeHash).toBe('string');
      expect(queues['send-email'].add).toHaveBeenCalledWith(
        'reviewOtp',
        expect.objectContaining({
          template: 'reviewOtpRequested',
          to: 'guest@example.com',
        }),
      );
    });

    it('throws NotFound when the business is missing', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        guestReviewService.requestOtp({ businessId: 'missing', identifier: 'a@b.co' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('refuses un-published businesses', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...publishedBusiness,
        status: 'DRAFT',
      });
      await expect(
        guestReviewService.requestOtp({ businessId: 'biz_123', identifier: 'a@b.co' }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe('verifyAndSubmit', () => {
    const baseInput = {
      businessId: 'biz_123',
      identifier: 'guest@example.com',
      code: '123456',
      rating: 5,
      content: 'Absolutely loved it — clean, fast, friendly service.',
    };

    it('rejects when no active OTP exists', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      (authRepository.findActiveOtp as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(guestReviewService.verifyAndSubmit(baseInput as any)).rejects.toMatchObject({
        code: 'OTP_INVALID',
      });
    });

    it('rejects an incorrect code', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      (authRepository.findActiveOtp as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'otp_1',
        codeHash: hashOtp('999999'),
      });
      await expect(guestReviewService.verifyAndSubmit(baseInput as any)).rejects.toMatchObject({
        code: 'OTP_INVALID',
      });
      expect(authRepository.incrementOtpAttempts).toHaveBeenCalledWith('otp_1');
    });

    it('provisions a new user and creates the review on success', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      (authRepository.findActiveOtp as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'otp_1',
        codeHash: hashOtp('123456'),
      });
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user_new',
        email: 'guest@example.com',
        role: 'CUSTOMER',
      });
      (reviewRepository.findByUserAndBusiness as ReturnType<typeof vi.fn>).mockResolvedValue(null);
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
      expect(authRepository.consumeOtp).toHaveBeenCalledWith('otp_1');
    });

    it('throws DuplicateReviewError if a review already exists', async () => {
      (businessRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(publishedBusiness);
      (authRepository.findActiveOtp as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'otp_1',
        codeHash: hashOtp('123456'),
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user_existing' });
      (reviewRepository.findByUserAndBusiness as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'review_existing',
      });

      await expect(
        guestReviewService.verifyAndSubmit(baseInput as any),
      ).rejects.toBeInstanceOf(DuplicateReviewError);
      expect(reviewRepository.create).not.toHaveBeenCalled();
    });
  });
});