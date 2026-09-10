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

// Auth + active-user for everyone; CUSTOMER is permitted in addition
// to BUSINESS because every controller here resolves the caller's
// owned business from the JWT subject via `requireOwnedBusiness` and
// 404s if none exists. Allowing CUSTOMER lets a freshly-upgraded user
// hit `/businesses/me/profile` without first refreshing their token
// (and lets the dashboard's "you don't own a business yet" path
// return a real 404 instead of a misleading 403).
router.use(authRequired, ensureActiveUser, requireRole('BUSINESS', 'PROFESSIONAL', 'CUSTOMER'));

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