/**
 * Subscriptions controller — owner-facing endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/db/prisma';
import { NotFoundError, BadRequestError } from '../../lib/errors/AppError';
import { validate } from '../../middleware/validate';
import {
  adminListPaymentsSchema,
  cancelSubscriptionSchema,
  subscribePlanSchema,
  validateVoucherSchema,
} from '@credible/shared';
import { buildPaginationMeta, normalizePagination } from '@credible/shared';
import { paymentService } from '../../services/paymentService';
import { subscriptionService } from '../../services/subscriptionService';
import { voucherService } from '../../services/voucherService';
import { invoiceService } from '../../services/invoiceService';
import type { Response as ExpressResponse } from 'express';

async function ownedBusinessId(ownerId: string): Promise<string> {
  const business = await prisma.business.findUnique({
    where: { ownerId },
    select: { id: true },
  });
  if (!business) throw new NotFoundError('Business');
  return business.id;
}

export const subscriptionsController = {
  // GET /business/subscription
  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await ownedBusinessId(req.user!.id);
      const view = await subscriptionService.getCurrentForBusiness(businessId);
      res.json({ success: true, data: view });
    } catch (e) {
      next(e);
    }
  },

  // GET /business/subscription/plans
  async listPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await subscriptionService.listPlans();
      res.json({ success: true, data: plans });
    } catch (e) {
      next(e);
    }
  },

  // POST /business/subscription/subscribe
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ReturnType<typeof subscribePlanSchema.parse>;
      const businessId = await ownedBusinessId(req.user!.id);
      const result = await paymentService.initiateCheckout({
        userId: req.user!.id,
        businessId,
        planId: input.planId,
        billingCycle: input.billingCycle,
        gateway: input.gateway,
        voucherCode: input.voucherCode,
      });
      res.json({
        success: true,
        data: {
          subscriptionId: result.subscriptionId,
          paymentId: result.paymentId,
          gateway: result.gateway,
          paymentUrl: result.redirectUrl,
          redirectType: 'GATEWAY_REDIRECT' as const,
          amount: result.amount,
          currency: result.currency,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  // POST /business/subscription/cancel
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ReturnType<typeof cancelSubscriptionSchema.parse>;
      const businessId = await ownedBusinessId(req.user!.id);
      const data = await subscriptionService.cancel({
        businessId,
        immediate: input.immediate,
        reason: input.reason,
        actorId: req.user!.id,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // POST /business/subscription/reactivate
  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await ownedBusinessId(req.user!.id);
      const data = await subscriptionService.reactivate(businessId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // GET /business/subscription/invoices
  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await ownedBusinessId(req.user!.id);
      const { page, perPage, skip, take } = normalizePagination(req.query);
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const { items, total } = await invoiceService.listForBusiness(businessId, {
        page,
        perPage,
        status,
      });
      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },

  // GET /business/subscription/invoices/:invoiceId
  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await ownedBusinessId(req.user!.id);
      const invoice = await invoiceService.getForBusiness(businessId, req.params.invoiceId as string);
      res.json({ success: true, data: invoice });
    } catch (e) {
      next(e);
    }
  },

  // GET /business/subscription/invoices/:invoiceId/download
  async downloadInvoice(req: Request, res: ExpressResponse, next: NextFunction) {
    try {
      const businessId = await ownedBusinessId(req.user!.id);
      await invoiceService.getForBusiness(businessId, req.params.invoiceId as string);
      await invoiceService.streamToResponse(req.params.invoiceId as string, res);
    } catch (e) {
      next(e);
    }
  },

  // GET /business/subscription/payment-history
  async paymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await ownedBusinessId(req.user!.id);
      const { page, perPage, skip, take } = normalizePagination(req.query);
      const [items, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where: { businessId },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.payment.count({ where: { businessId } }),
      ]);
      res.json({ success: true, data: items, meta: buildPaginationMeta(total, page, perPage) });
    } catch (e) {
      next(e);
    }
  },

  // POST /business/subscription/voucher/validate
  async validateVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ReturnType<typeof validateVoucherSchema.parse>;
      const businessId = await ownedBusinessId(req.user!.id).catch(() => undefined);
      const result = await voucherService.validate({
        code: input.code,
        planId: input.planId,
        amount: input.amount,
        businessId,
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
};

// Validate helpers — used by routes when input is from URL params
export const __validate = {
  subscribe: validate(subscribePlanSchema),
  cancel: validate(cancelSubscriptionSchema),
  validateVoucher: validate(validateVoucherSchema),
  adminListPayments: validate(adminListPaymentsSchema, 'query'),
};
