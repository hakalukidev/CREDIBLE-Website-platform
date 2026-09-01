import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { logger } from '../../lib/logger/logger';
import { issueTokenPair } from '../../lib/utils/jwt';
import type { UserRole } from '@prisma/client';

/**
 * OAuth controller — drives the popup + postMessage flow used by the
 * Next.js frontend.
 *
 * - `providers` returns a small JSON describing which providers are configured,
 *   so the login page can hide / show buttons accordingly without leaking
 *   the actual client IDs to the browser.
 * - `callback` is the handler wired to the Passport `verify` callback. It
 *   builds a JWT pair for the authenticated user and writes a small HTML
 *   page that `postMessage`s the tokens to the opener window before closing
 *   itself.
 */
export const oauthController = {
  providers(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        facebook: Boolean(env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET),
      },
    });
  },

  callback(provider: 'google' | 'facebook') {
    return (req: Request, res: Response) => {
      try {
        const user = req.user as { id: string; email: string; role: UserRole } | undefined;
        if (!user) {
          return res
            .status(401)
            .type('html')
            .send(buildFailurePage(provider, 'No user data returned by provider'));
        }
        const tokens = issueTokenPair({ id: user.id, email: user.email, role: user.role });
        logger.info({ userId: user.id, provider }, 'OAuth login succeeded');
        res
          .status(200)
          .type('html')
          .send(buildSuccessPage(tokens.accessToken, tokens.refreshToken, tokens.expiresIn, user));
      } catch (err) {
        logger.error({ err, provider }, 'OAuth callback failed');
        res
          .status(500)
          .type('html')
          .send(buildFailurePage(provider, 'Internal error completing sign-in'));
      }
    };
  },
};

interface TokenPairLike {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function buildSuccessPage(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  user: { id: string; email: string; role: UserRole },
): string {
  // The opener receives the tokens and persists them. We deliberately use
  // `*` for targetOrigin so the popup works regardless of how the frontend
  // is hosted — the alternative is to read `document.referrer` and validate
  // it's our WEB_URL, but that breaks for `localhost` development.
  const payload = JSON.stringify({
    type: 'credible:oauth',
    tokens: { accessToken, refreshToken, expiresIn },
    user: { id: user.id, email: user.email, role: user.role },
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sign-in complete</title>
  <style>
    body { font: 14px/1.4 system-ui, sans-serif; background: #0b1220; color: #f3f4f6; display: grid; place-items: center; height: 100vh; margin: 0; }
    .box { background: #111827; border: 1px solid #1f2937; padding: 24px 28px; border-radius: 12px; max-width: 360px; text-align: center; }
    .ok { color: #34d399; font-size: 28px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="ok">✓</div>
    <p>You're signed in. This window will close automatically.</p>
  </div>
  <script>
    (function () {
      try {
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(payload)}, '*');
        }
      } catch (e) {}
      setTimeout(function () { window.close(); }, 250);
    })();
  </script>
</body>
</html>`;
}

function buildFailurePage(provider: 'google' | 'facebook', message: string): string {
  const safeMessage = JSON.stringify({ type: 'credible:oauth:failed', provider, message });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sign-in failed</title>
  <style>
    body { font: 14px/1.4 system-ui, sans-serif; background: #0b1220; color: #f3f4f6; display: grid; place-items: center; height: 100vh; margin: 0; }
    .box { background: #111827; border: 1px solid #1f2937; padding: 24px 28px; border-radius: 12px; max-width: 360px; text-align: center; }
    .err { color: #f87171; font-size: 28px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="err">✗</div>
    <p>Sign-in failed. Please close this window and try again.</p>
  </div>
  <script>
    (function () {
      try {
        if (window.opener) {
          window.opener.postMessage(${safeMessage}, '*');
        }
      } catch (e) {}
      setTimeout(function () { window.close(); }, 250);
    })();
  </script>
</body>
</html>`;
}
