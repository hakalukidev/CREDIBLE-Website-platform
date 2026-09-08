/**
 * Admin reviews routes.
 *
 * Mounted under `/admin/reviews/*` — every route inherits the same ADMIN guard
 * chain as the rest of the admin surface.
 */
import { Router } from 'express';
import {
  adminListReviewsSchema,
  adminRespondReviewSchema,
  adminResolveReviewFlagSchema,
  adminForceReviewStatusSchema,
} from '@credible/shared';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { adminReviewsController } from './admin-reviews.controller';

const router = Router();

router.use(authRequired, ensureActiveUser, requireRole('ADMIN'));

router.get('/', validate(adminListReviewsSchema, 'query'), adminReviewsController.list);
router.get('/:id', adminReviewsController.get);
router.post('/:id/respond', validate(adminRespondReviewSchema), adminReviewsController.respond);
router.post(
  '/:reviewId/flags/:flagId/resolve',
  validate(adminResolveReviewFlagSchema),
  adminReviewsController.resolveFlag,
);
router.post(
  '/:id/status',
  validate(adminForceReviewStatusSchema),
  adminReviewsController.forceStatus,
);

export { router as adminReviewsRouter };
export default router;