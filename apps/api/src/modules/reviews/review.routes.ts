import { Router } from 'express';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewResponseSchema,
  flagReviewSchema,
  listReviewsSchema,
} from '@credible/shared';
import { validate } from '../../middleware/validate';
import { authRequired, authOptional, ensureActiveUser } from '../../middleware/auth';
import { reviewController } from './review.controller';
import { guestReviewRouter } from './guest.routes';

const router = Router({ mergeParams: true });

// Public list — auth optional (we may use req.user later to indicate "already reviewed")
router.get(
  '/businesses/:businessId/reviews',
  authOptional,
  validate(listReviewsSchema, 'query'),
  reviewController.listForBusiness,
);
router.get(
  '/professionals/:professionalId/reviews',
  authOptional,
  validate(listReviewsSchema, 'query'),
  reviewController.listForProfessional,
);

// Authenticated operations
router.post(
  '/reviews',
  authRequired,
  ensureActiveUser,
  validate(createReviewSchema),
  reviewController.create,
);
router.get(
  '/reviews/:id',
  authRequired,
  ensureActiveUser,
  reviewController.getOne,
);
router.patch(
  '/reviews/:id',
  authRequired,
  ensureActiveUser,
  validate(updateReviewSchema),
  reviewController.update,
);
router.get(
  '/reviews/me',
  authRequired,
  ensureActiveUser,
  reviewController.listMine,
);
router.post(
  '/reviews/:id/respond',
  authRequired,
  ensureActiveUser,
  validate(reviewResponseSchema),
  reviewController.respond,
);
router.post(
  '/reviews/:id/flag',
  authRequired,
  ensureActiveUser,
  validate(flagReviewSchema),
  reviewController.flag,
);

// Phase 2 — guest OTP flow (mounted at the same root).
router.use('/', guestReviewRouter);

export { router as reviewRouter };
export default router;