import { Router } from 'express';
import { z } from 'zod';
import { submitReviewOtpSchema, verifyReviewOtpSchema } from '@credible/shared';
import { validate } from '../../middleware/validate';
import { reviewOtpRateLimit, reviewSubmissionRateLimit } from '../../middleware/rateLimit';
import { guestReviewController } from './guest.controller';

const router = Router();

const reviewStatusQuerySchema = z
  .object({
    identifier: z.string().trim().min(3).max(254),
    businessId: z.string().cuid(),
  })
  .strict();

router.post(
  '/reviews/submit-otp',
  reviewOtpRateLimit,
  validate(submitReviewOtpSchema),
  guestReviewController.requestOtp,
);

router.post(
  '/reviews/guest',
  reviewSubmissionRateLimit,
  validate(verifyReviewOtpSchema),
  guestReviewController.verifyAndSubmit,
);

router.get(
  '/reviews/status',
  reviewOtpRateLimit, // status checks are cheap but we still cap them
  validate(reviewStatusQuerySchema, 'query'),
  guestReviewController.getReviewStatus,
);

export { router as guestReviewRouter };
export default router;
