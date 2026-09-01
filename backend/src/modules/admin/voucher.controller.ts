/**
 * Admin billing + voucher controller.
 *
 *   GET    /admin/payments           — list with filters
 *   GET    /admin/payments/stats     — KPIs (revenue, plan counts)
 *   GET    /admin/subscriptions      — list with filters
 *   GET    /admin/vouchers           — list
 *   POST   /admin/vouchers           — create
 *   GET    /admin/vouchers/:id       — read
 *   PUT    /admin/vouchers/:id       — update
 *   DELETE /admin/vouchers/:id       — deactivate
 */

import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/db/prisma';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  adminListPaymentsSchema,
  adminListSubscriptionsSchema,
  createVoucherSchema,
  updateVoucherSchema,
} from '@credible/shared';
import { voucherService } from '../../services/voucherService';
import { NotFoundError } from '../../lib/errors/AppError';

const router = Router();
router.use(authRequired, ensureActiveUser, requireRole('ADMIN'));

// ----- Payments -----
router.get(
  '/payments',
  validate(adminListPaymentsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage, status, gateway, dateFrom, dateTo, search } = req.query as unknown as {
        page: number;
        perPage: number;
        status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELED';
        gateway?: 'AAMARPAY' | 'SSLCOMMERZ' | 'MANUAL';
        dateFrom?: Date;
        dateTo?: Date;
        search?: string;
      };
      const skip = (page - 1) * perPage;
      const where = {
        ...(status ? { status } : {}),
        ...(gateway ? { gateway } : {}),
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { gatewayTxnId: { contains: search, mode: 'insensitive' as const } },
                { business: { displayName: { contains: search, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      };
      const [items, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where,
          include: {
            business: { select: { id: true, displayName: true, slug: true } },
            subscription: { select: { id: true, plan: true, billingCycle: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.payment.count({ where }),
      ]);
      res.json({
        success: true,
        data: items,
        meta: {
          page,
          perPage,
          total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.get('/payments/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenueAgg, monthlyRevenueAgg, planCounts, recent] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.subscription.groupBy({
        by: ['plan', 'status'],
        _count: true,
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        include: { business: { select: { displayName: true, slug: true } } },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),
    ]);

    const subscriptionCounts: Record<string, number> = { FREE: 0, BASIC: 0, PROFESSIONAL: 0, ENTERPRISE: 0 };
    for (const row of planCounts) {
      if (row.status === 'ACTIVE' || row.status === 'TRIALING') {
        subscriptionCounts[row.plan] = (subscriptionCounts[row.plan] ?? 0) + row._count;
      }
    }

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenueAgg._sum.amount ?? 0),
        totalSuccessfulPayments: totalRevenueAgg._count,
        monthlyRevenue: Number(monthlyRevenueAgg._sum.amount ?? 0),
        subscriptionCount: subscriptionCounts,
        recentTransactions: recent.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          gateway: p.gateway,
          paidAt: p.paidAt,
          businessName: p.business?.displayName ?? null,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
});

// ----- Subscriptions -----
router.get(
  '/subscriptions',
  validate(adminListSubscriptionsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage, status, plan, search } = req.query as unknown as {
        page: number;
        perPage: number;
        status?: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
        plan?: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
        search?: string;
      };
      const skip = (page - 1) * perPage;
      const where = {
        ...(status ? { status } : {}),
        ...(plan ? { plan } : {}),
        ...(search
          ? {
              OR: [
                { business: { displayName: { contains: search, mode: 'insensitive' as const } } },
                { user: { email: { contains: search, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      };
      const [items, total] = await prisma.$transaction([
        prisma.subscription.findMany({
          where,
          include: {
            business: { select: { id: true, displayName: true, slug: true } },
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.subscription.count({ where }),
      ]);
      res.json({
        success: true,
        data: items,
        meta: {
          page,
          perPage,
          total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

// ----- Vouchers -----
const voucherListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  active: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().trim().max(120).optional(),
});

router.get(
  '/vouchers',
  validate(voucherListSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage, active, search } = req.query as unknown as {
        page: number;
        perPage: number;
        active?: boolean;
        search?: string;
      };
      const { items, total } = await voucherService.list({ page, perPage, active, search });
      res.json({
        success: true,
        data: items,
        meta: {
          page,
          perPage,
          total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/vouchers',
  validate(createVoucherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voucher = await voucherService.create(req.body);
      res.status(201).json({ success: true, data: voucher });
    } catch (e) {
      next(e);
    }
  },
);

router.get('/vouchers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await voucherService.getById(req.params.id as string);
    res.json({ success: true, data: voucher });
  } catch (e) {
    next(e);
  }
});

router.put(
  '/vouchers/:id',
  validate(updateVoucherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voucher = await voucherService.update(req.params.id as string, req.body);
      res.json({ success: true, data: voucher });
    } catch (e) {
      next(e);
    }
  },
);

router.delete('/vouchers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await voucherService.deactivate(req.params.id as string);
    res.json({ success: true, data: voucher });
  } catch (e) {
    next(e);
  }
});

export { router as billingRouter };
export default router;

// Helper used elsewhere — exported so routes can throw meaningful 404s.
export function notFound(res: Response, msg = 'Not found'): typeof res {
  throw new NotFoundError(msg);
}