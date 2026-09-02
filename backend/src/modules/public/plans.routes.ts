/**
 * Public plans router — mounted at /plans (no auth).
 *
 *   GET /plans  → active subscription plans for marketing pages
 */

import { Router } from 'express';
import { plansController } from './plans.controller';

const router = Router();

router.get('/plans', plansController.list);

export { router as publicPlansRouter };
export default router;
