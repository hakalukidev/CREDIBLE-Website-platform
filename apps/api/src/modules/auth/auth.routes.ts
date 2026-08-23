import { Router } from 'express';
import { authRateLimit } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from '@credible/shared';
import { authController } from './auth.controller';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.post('/otp/request', authRateLimit, validate(requestOtpSchema), authController.requestOtp);
router.post('/otp/verify', authRateLimit, validate(verifyOtpSchema), authController.verifyOtp);

// OAuth (Google + Facebook) via Passport — wired in passport.ts
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), ...);
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), ...);

export { router as authRouter };
export default router;