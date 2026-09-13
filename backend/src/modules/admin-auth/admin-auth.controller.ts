import type { Request, Response, NextFunction } from 'express';
import { adminAuthService } from './admin-auth.service';
import { audit } from '../../lib/audit/log';

function requestMeta(req: Request): { ip: string | null; userAgent: string | null } {
  return {
    ip: req.ip ?? null,
    userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
  };
}

export const adminAuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminAuthService.login(req.body, requestMeta(req));
      if (result.twoFactorRequired) {
        res.json({ success: true, data: { twoFactorRequired: true } });
        return;
      }
      // The dedicated admin JWT goes in an httpOnly cookie so Next.js
      // middleware can enforce the admin route group server-side, and it is
      // returned in the body for the SPA's axios header flow.
      res.cookie('credible_admin', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (result.expiresIn ?? 1800) * 1000,
        path: '/',
      });
      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          expiresIn: result.expiresIn,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async requestTwoFactorCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminAuthService.requestTwoFactorCode(req.body, requestMeta(req));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await adminAuthService.logout(req.user?.id ?? null, requestMeta(req));
      res.clearCookie('credible_admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      res.json({ success: true, data: { loggedOut: true } });
    } catch (e) {
      next(e);
    }
  },

  async me(req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        user: req.user,
        authenticated: true,
      },
    });
  },

  async logVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const path = (req.body?.path ?? req.originalUrl) as string;
      await audit({
        actorId: req.user?.id ?? null,
        action: 'admin.page.visit',
        target: path,
        meta: null,
        ip: requestMeta(req).ip,
        userAgent: requestMeta(req).userAgent,
      });
      res.json({ success: true, data: { logged: true } });
    } catch (e) {
      next(e);
    }
  },
};