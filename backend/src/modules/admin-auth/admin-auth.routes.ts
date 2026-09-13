import { Router } from 'express';
import { adminLoginRateLimit } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { adminAuthRequired } from '../../middleware/auth';
import { adminLoginSchema, adminLoginOtpSchema } from '@credible/shared';
import { adminAuthController } from './admin-auth.controller';

const router = Router();

/**
 * The admin gateway. Mounted at `/admin/*`. Login, OTP request and logout are
 * deliberately *not* behind `adminAuthRequired` — login is the entry point and
 * logout must be reachable with an already-expired session. Everything else
 * under `/admin` is guarded by the dedicated admin JWT.
 */
router.post('/login', adminLoginRateLimit, validate(adminLoginSchema), adminAuthController.login);
router.post(
  '/login/otp',
  adminLoginRateLimit,
  validate(adminLoginOtpSchema),
  adminAuthController.requestTwoFactorCode,
);
router.post('/logout', adminLoginRateLimit, adminAuthController.logout);

// Authenticated helpers for the admin SPA.
router.get('/me', adminAuthRequired, adminAuthController.me);
router.post('/audit/visit', adminAuthRequired, adminAuthController.logVisit);

export { router as adminAuthRouter };
export default router;