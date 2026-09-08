import { Router } from 'express';
import { authRequired, ensureActiveUser } from '../../middleware/auth';
import { businessAnalyticsController } from './analytics.controller';

const router = Router();

router.use(authRequired, ensureActiveUser);

router.get('/analytics', businessAnalyticsController.get);
router.get('/analytics/export.csv', businessAnalyticsController.exportCsv);

export { router as businessAnalyticsRouter };
export default router;