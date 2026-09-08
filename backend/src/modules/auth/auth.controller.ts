import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { queues } from '../../lib/queue/queues';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      // Queue welcome email
      await queues['send-email'].add('welcome', {
        template: 'welcome',
        to: result.user.email,
        vars: { firstName: result.user.firstName },
      });
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await authService.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  async logout(_req: Request, res: Response) {
    // Stateless JWT: clients drop the token. For revocation, store jti in Redis.
    res.json({ success: true, data: { loggedOut: true } });
  },

  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, purpose } = req.body as {
        email?: string;
        phone?: string;
        purpose: string;
      };
      const result = await authService.requestOtp(email, phone, purpose);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, code, purpose } = req.body as {
        email?: string;
        phone?: string;
        code: string;
        purpose: string;
      };
      const result = await authService.verifyOtp(email, phone, code, purpose);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
};