import { Router } from 'express';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { moderationDecisionSchema } from '@credible/shared';
import { adminController } from './admin.controller';

const router = Router();

router.use(authRequired, ensureActiveUser, requireRole('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/reviews/flagged', adminController.listFlaggedReviews);
router.post('/reviews/:reviewId/moderate', validate(moderationDecisionSchema), adminController.moderateReview);

export { router as adminRouter };
export default router;