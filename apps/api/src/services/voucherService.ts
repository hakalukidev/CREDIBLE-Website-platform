/**
 * Voucher service — validation, redemption and admin CRUD for discount codes.
 *
 * Vouchers apply to a list of `SubscriptionPlan`s and can be either a
 * percentage off (with an optional max discount cap) or a fixed amount off.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors/AppError';
import type {
  DiscountType,
  SubscriptionPlan,
} from '@credible/types';

export interface VoucherValidationInput {
  code: string;
  planId: SubscriptionPlan;
  amount: number;
  /** Used to disallow the same business from redeeming the same voucher twice. */
  businessId?: string;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucherId?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  discountedPrice: number;
  message: string;
}

export const voucherService = {
  /**
   * Validate a voucher against the requested plan and amount. Does NOT
   * consume a redemption slot — call `redeem()` after a successful payment.
   */
  async validate(input: VoucherValidationInput): Promise<VoucherValidationResult> {
    const code = input.code.toUpperCase().trim();
    const voucher = await prisma.voucher.findUnique({ where: { code } });

    const baseResult: VoucherValidationResult = {
      valid: false,
      code,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      maxDiscountAmount: null,
      discountAmount: 0,
      discountedPrice: input.amount,
      message: '',
    };

    if (!voucher || !voucher.isActive) {
      return { ...baseResult, message: 'Voucher not found or inactive' };
    }
    const now = new Date();
    if (voucher.validFrom > now || voucher.validUntil < now) {
      return { ...baseResult, message: 'Voucher has expired' };
    }
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      return { ...baseResult, message: 'Voucher has reached its usage limit' };
    }
    if (voucher.minPurchaseAmount !== null && input.amount < Number(voucher.minPurchaseAmount)) {
      return {
        ...baseResult,
        message: `Minimum purchase amount is ${voucher.minPurchaseAmount} BDT`,
      };
    }
    if (!voucher.applicablePlans.includes(input.planId)) {
      return { ...baseResult, message: 'Voucher is not applicable to this plan' };
    }
    if (input.businessId) {
      const prior = await prisma.voucherRedemption.findFirst({
        where: { voucherId: voucher.id, businessId: input.businessId },
        select: { id: true },
      });
      if (prior) {
        return { ...baseResult, message: 'You have already used this voucher' };
      }
    }

    const discountValue = Number(voucher.discountValue);
    const maxDiscount = voucher.maxDiscountAmount !== null ? Number(voucher.maxDiscountAmount) : null;

    let discountAmount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = (input.amount * discountValue) / 100;
      if (maxDiscount !== null) discountAmount = Math.min(discountAmount, maxDiscount);
    } else {
      discountAmount = Math.min(discountValue, input.amount);
    }

    discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);

    return {
      valid: true,
      voucherId: voucher.id,
      code,
      discountType: voucher.discountType,
      discountValue,
      maxDiscountAmount: maxDiscount,
      discountAmount,
      discountedPrice: Math.max(0, Math.round((input.amount - discountAmount) * 100) / 100),
      message: 'Voucher applied',
    };
  },

  /**
   * Atomically consume one redemption slot. Caller must wrap payment + voucher
   * redemption in a single transaction to guarantee consistency.
   */
  async redeem(
    tx: Prisma.TransactionClient,
    args: {
      voucherId: string;
      businessId: string;
      subscriptionId?: string | null;
      discountApplied: number;
    },
  ) {
    const voucher = await tx.voucher.findUnique({ where: { id: args.voucherId } });
    if (!voucher) throw new NotFoundError('Voucher');
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      throw new ConflictError('Voucher has reached its usage limit', 'VOUCHER_EXHAUSTED');
    }
    if (!voucher.isActive) {
      throw new BadRequestError('Voucher is no longer active', 'VOUCHER_INACTIVE');
    }
    await tx.voucher.update({
      where: { id: args.voucherId },
      data: { usedCount: { increment: 1 } },
    });
    return tx.voucherRedemption.create({
      data: {
        voucherId: args.voucherId,
        businessId: args.businessId,
        subscriptionId: args.subscriptionId ?? null,
        discountApplied: args.discountApplied,
      },
    });
  },

  // ---- Admin CRUD ----

  async create(input: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minPurchaseAmount?: number;
    maxUses?: number;
    validFrom: Date;
    validUntil: Date;
    applicablePlans: SubscriptionPlan[];
    isActive?: boolean;
    createdBy?: string;
  }) {
    const code = input.code.toUpperCase().trim();
    const existing = await prisma.voucher.findUnique({ where: { code } });
    if (existing) throw new ConflictError('Voucher code already exists', 'VOUCHER_EXISTS');
    if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100', 'INVALID_DISCOUNT');
    }
    if (input.validFrom >= input.validUntil) {
      throw new BadRequestError('validFrom must be before validUntil', 'INVALID_VALIDITY');
    }
    return prisma.voucher.create({
      data: {
        code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        minPurchaseAmount: input.minPurchaseAmount ?? null,
        maxUses: input.maxUses ?? null,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        applicablePlans: input.applicablePlans,
        isActive: input.isActive ?? true,
      },
    });
  },

  async update(
    id: string,
    patch: Partial<{
      description: string;
      discountValue: number;
      maxDiscountAmount: number | null;
      minPurchaseAmount: number | null;
      maxUses: number | null;
      validFrom: Date;
      validUntil: Date;
      applicablePlans: SubscriptionPlan[];
      isActive: boolean;
    }>,
  ) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundError('Voucher');
    return prisma.voucher.update({ where: { id }, data: patch });
  },

  async deactivate(id: string) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundError('Voucher');
    return prisma.voucher.update({ where: { id }, data: { isActive: false } });
  },

  async list(opts: { page: number; perPage: number; active?: boolean; search?: string }) {
    const where = {
      ...(opts.active !== undefined ? { isActive: opts.active } : {}),
      ...(opts.search
        ? { code: { contains: opts.search, mode: 'insensitive' as const } }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
      }),
      prisma.voucher.count({ where }),
    ]);
    return { items, total };
  },

  async getById(id: string) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundError('Voucher');
    return voucher;
  },
};

export default voucherService;
