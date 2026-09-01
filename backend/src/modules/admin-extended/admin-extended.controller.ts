/**
 * Admin-extended controller.
 *
 * Thin HTTP layer over `adminExtendedService` — the heavy lifting (DB queries,
 * pagination, joins) lives in the service. Every mutating route also writes an
 * `AuditLog` entry so the audit log viewer can reconstruct admin activity.
 */
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  adminUpdateUserSchema,
  adminRefundPaymentSchema,
  adminCancelSubscriptionSchema,
  adminOverrideSubscriptionSchema,
  adminUpdateContactRequestSchema,
  adminUpdateSettingSchema,
} from '@credible/shared';
import { adminExtendedService } from './admin-extended.service';
import { audit } from '../../lib/audit/log';
import { NotFoundError } from '../../lib/errors/AppError';

const paramsId = z.object({ id: z.string().min(1) });
const paramsKey = z.object({ key: z.string().min(1).max(120) });

export const adminExtendedController = {
  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        search?: string;
        role?: string;
        status?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listUsers({
        search: q.search,
        role: q.role as never,
        status: q.status as never,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminExtendedService.getUser(id);
      if (!data) throw new NotFoundError('User');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const input = adminUpdateUserSchema.parse(req.body);
      const data = await adminExtendedService.updateUser(id, input);
      if (!data) throw new NotFoundError('User');
      await audit({
        actorId: req.user!.id,
        action: 'admin.user.update',
        target: id,
        meta: input as Prisma.InputJsonValue,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Businesses
  // ---------------------------------------------------------------------------

  async listBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        search?: string;
        status?: string;
        verificationStatus?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listBusinesses({
        search: q.search,
        status: q.status as never,
        verificationStatus: q.verificationStatus as never,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminExtendedService.getBusiness(id);
      if (!data) throw new NotFoundError('Business');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async setBusinessStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const status = String(req.body?.status ?? '');
      const data = await adminExtendedService.setBusinessStatus(id, status as never);
      await audit({
        actorId: req.user!.id,
        action: 'admin.business.status',
        target: id,
        meta: { status },
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Professionals
  // ---------------------------------------------------------------------------

  async listProfessionals(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        search?: string;
        status?: string;
        verificationStatus?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listProfessionals({
        search: q.search,
        status: q.status as never,
        verificationStatus: q.verificationStatus as never,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminExtendedService.getProfessional(id);
      if (!data) throw new NotFoundError('Professional');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async setProfessionalStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const status = String(req.body?.status ?? '');
      const data = await adminExtendedService.setProfessionalStatus(id, status as never);
      await audit({
        actorId: req.user!.id,
        action: 'admin.professional.status',
        target: id,
        meta: { status },
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        status?: string;
        gateway?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listPayments({
        status: q.status as never,
        gateway: q.gateway as never,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminExtendedService.getPayment(id);
      if (!data) throw new NotFoundError('Payment');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const input = adminRefundPaymentSchema.parse(req.body);
      const data = await adminExtendedService.refundPayment(id, input);
      if (!data) throw new NotFoundError('Payment');
      await audit({
        actorId: req.user!.id,
        action: 'admin.payment.refund',
        target: id,
        meta: input as Prisma.InputJsonValue,
      });
      // Queue the gateway-side refund job — it talks to aamarPay / sslcommerz
      // and updates the payment to REFUNDED once the gateway confirms. The DB
      // row above is the optimistic state for the admin UI.
      try {
        const { Queue } = await import('bullmq');
        const { redis } = await import('../../lib/queue/redis');
        const refundQueue = new Queue('payment-refund', { connection: redis });
        await refundQueue.add(
          'refund',
          {
            paymentId: id,
            amount: input.amount ?? null,
            reason: input.reason,
            adminId: req.user!.id,
          },
          { removeOnComplete: 100, removeOnFail: 200 },
        );
        await refundQueue.close();
      } catch {
        // Queue failures shouldn't fail the API call — admin already sees the
        // refund recorded locally. Worker can be triggered manually if needed.
      }
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  async listSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        plan?: string;
        status?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listSubscriptions({
        plan: q.plan as never,
        status: q.status as never,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminExtendedService.getSubscription(id);
      if (!data) throw new NotFoundError('Subscription');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const input = adminCancelSubscriptionSchema.parse(req.body);
      const data = await adminExtendedService.cancelSubscription(id, input.reason);
      await audit({
        actorId: req.user!.id,
        action: 'admin.subscription.cancel',
        target: id,
        meta: input as Prisma.InputJsonValue,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async overrideSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const input = adminOverrideSubscriptionSchema.parse(req.body);
      const data = await adminExtendedService.overrideSubscriptionPlan(id, {
        plan: input.plan,
        validUntil: input.validUntil,
      });
      await audit({
        actorId: req.user!.id,
        action: 'admin.subscription.override',
        target: id,
        meta: { plan: input.plan, validUntil: input.validUntil },
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Contact requests
  // ---------------------------------------------------------------------------

  async listContactRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        status?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listContactRequests({
        status: q.status as never,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 20),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getContactRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const data = await adminExtendedService.getContactRequest(id);
      if (!data) throw new NotFoundError('ContactRequest');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async updateContactRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paramsId.parse(req.params);
      const input = adminUpdateContactRequestSchema.parse(req.body);
      const data = await adminExtendedService.updateContactRequest(id, input);
      await audit({
        actorId: req.user!.id,
        action: 'admin.contact.update',
        target: id,
        meta: input as Prisma.InputJsonValue,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------

  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        actorId?: string;
        action?: string;
        from?: string;
        to?: string;
        page?: number;
        perPage?: number;
      };
      const data = await adminExtendedService.listAuditLogs({
        actorId: q.actorId,
        action: q.action,
        from: q.from ? new Date(q.from) : undefined,
        to: q.to ? new Date(q.to) : undefined,
        page: Number(q.page ?? 1),
        perPage: Number(q.perPage ?? 50),
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async listSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminExtendedService.listSettings();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async upsertSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = paramsKey.parse(req.params);
      const { value } = adminUpdateSettingSchema.parse(req.body);
      const data = await adminExtendedService.upsertSetting(key, value, req.user!.id);
      await audit({
        actorId: req.user!.id,
        action: 'admin.setting.update',
        target: key,
        meta: { value: value as Prisma.InputJsonValue },
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};