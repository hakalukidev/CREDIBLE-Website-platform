import { Router } from 'express';
import { z } from 'zod';
import { verifyReviewOtpSchema } from '@credible/shared';
import { validate } from '../../middleware/validate';
import { reviewSubmissionRateLimit } from '../../middleware/rateLimit';
import { guestReviewController } from './guest.controller';

const router = Router();

const reviewStatusQuerySchema = z
  .object({
    identifier: z.string().trim().min(3).max(254),
    businessId: z.string().cuid().optional(),
    professionalId: z.string().cuid().optional(),
  })
  .strict()
  .refine((d) => Boolean(d.businessId ?? d.professionalId), {
    message: 'Either businessId or professionalId is required',
  });

// OTP step removed. Guests can post a review without verifying an email/phone.
router.post(
  '/reviews/guest',
  reviewSubmissionRateLimit,
  validate(verifyReviewOtpSchema),
  guestReviewController.verifyAndSubmit,
);

router.get(
  '/reviews/status',
  reviewSubmissionRateLimit,
  validate(reviewStatusQuerySchema, 'query'),
  guestReviewController.getReviewStatus,
);

export { router as guestReviewRouter };
export default router;
