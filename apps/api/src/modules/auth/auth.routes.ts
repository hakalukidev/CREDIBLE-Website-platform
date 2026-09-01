import { Router } from 'express';
import passport from 'passport';
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
import { oauthController } from './oauth.controller';
import { env } from '../../config/env';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.post('/otp/request', authRateLimit, validate(requestOtpSchema), authController.requestOtp);
router.post('/otp/verify', authRateLimit, validate(verifyOtpSchema), authController.verifyOtp);

// ---------------------------------------------------------------------------
// OAuth — Google + Facebook via Passport.js
// ---------------------------------------------------------------------------
// The popup + postMessage flow:
//   1. Frontend opens a popup window at `/auth/{google|facebook}`.
//   2. Passport redirects to the provider's consent screen.
//   3. Provider redirects back to `/auth/{provider}/callback`.
//   4. Passport verifies the profile, our verify callback persists/upserts
//      the user, and the controller postMessages a token pair back to the
//      opener window (closing itself).
//
// `failureRedirect` is used as a fallback if Passport throws (rare; usually
// the popup itself handles user-initiated errors like closing the window).

router.get('/oauth/providers', oauthController.providers);

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    authRateLimit,
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    }),
  );
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.WEB_URL}/login?oauth=failed&provider=google`,
    }),
    oauthController.callback('google'),
  );
}

if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  router.get(
    '/facebook',
    authRateLimit,
    passport.authenticate('facebook', {
      scope: ['email'],
      session: false,
    }),
  );
  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: `${env.WEB_URL}/login?oauth=failed&provider=facebook`,
    }),
    oauthController.callback('facebook'),
  );
}

export { router as authRouter };
export default router;
