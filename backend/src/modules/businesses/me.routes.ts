import { Router } from 'express';
import {
  businessProfileUpdateSchema,
  inviteCustomerSchema,
  ownerReviewListSchema,
  reviewResponseSchema,
  flagReviewSchema,
} from '@credible/shared';
import { validate } from '../../middleware/validate';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { inviteRateLimit } from '../../middleware/rateLimit';
import { checkFeature } from '../../middleware/featureGate';
import { meController } from './me.controller';

const router = Router();

// All routes require an authenticated BUSINESS owner.
router.use(authRequired, ensureActiveUser, requireRole('BUSINESS'));

router.get('/profile', meController.getProfile);
router.patch('/profile', validate(businessProfileUpdateSchema), meController.updateProfile);

// Owner review management — same shape as the public list plus a free-text search.
router.get(
  '/reviews',
  validate(ownerReviewListSchema, 'query'),
  meController.listReviews,
);
router.get('/reviews/:reviewId', meController.getReview);
router.post(
  '/reviews/:reviewId/respond',
  validate(reviewResponseSchema),
  meController.respondReview,
);
router.post(
  '/reviews/:reviewId/report',
  validate(flagReviewSchema),
  meController.reportReview,
);

// Phase 4 — premium gating.
// QR generation is BASIC+; the basic invite flow enforces both monthly limits
// and the plan-level `canSendInvitations` flag.
router.post(
  '/invite',
  inviteRateLimit,
  checkFeature('reviewInvitations'),
  validate(inviteCustomerSchema),
  meController.invite,
);
router.get('/qr-code', checkFeature('canGenerateQR'), meController.qrCode);

export { router as meRouter };
export default router;