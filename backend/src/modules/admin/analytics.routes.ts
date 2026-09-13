import { Router } from 'express';
import { adminAuthRequired } from '../../middleware/auth';
import { adminAnalyticsController } from './analytics.controller';

const router = Router();

router.use(adminAuthRequired);

router.get('/analytics', adminAnalyticsController.get);
router.get('/analytics/export.csv', adminAnalyticsController.exportCsv);

export { router as adminAnalyticsRouter };
export default router;