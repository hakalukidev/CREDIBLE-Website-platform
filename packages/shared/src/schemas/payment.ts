import { z } from 'zod';

export const subscriptionPlanEnum = z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']);
export const billingCycleEnum = z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const gatewayEnum = z.enum(['AAMARPAY', 'SSLCOMMERZ', 'MANUAL']);
export const discountTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);
export const invoiceStatusEnum = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);

export const createSubscriptionSchema = z
  .object({
    plan: subscriptionPlanEnum,
    businessId: z.string().cuid().optional(),
    billingCycle: billingCycleEnum.default('MONTHLY'),
    gateway: gatewayEnum.default('AAMARPAY'),
  })
  .strict();

export const cancelSubscriptionSchema = z
  .object({
    immediate: z.boolean().default(false),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const subscribePlanSchema = z
  .object({
    planId: subscriptionPlanEnum,
    billingCycle: billingCycleEnum,
    gateway: gatewayEnum.default('AAMARPAY'),
    voucherCode: z.string().trim().min(2).max(64).optional(),
  })
  .strict();

export const validateVoucherSchema = z
  .object({
    code: z.string().trim().min(2).max(64),
    planId: subscriptionPlanEnum,
    amount: z.number().positive().max(1_000_000),
  })
  .strict();

export const createVoucherSchema = z
  .object({
    code: z.string().trim().min(2).max(64),
    description: z.string().trim().max(500).optional(),
    discountType: discountTypeEnum,
    discountValue: z.number().positive().max(100_000),
    maxDiscountAmount: z.number().positive().optional(),
    minPurchaseAmount: z.number().positive().optional(),
    maxUses: z.number().int().positive().optional(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    applicablePlans: z.array(subscriptionPlanEnum).min(1),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updateVoucherSchema = createVoucherSchema.partial();

export const adminListPaymentsSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    perPage: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELED']).optional(),
    gateway: gatewayEnum.optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    search: z.string().trim().max(120).optional(),
  })
  .strict();

export const adminListSubscriptionsSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    perPage: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID']).optional(),
    plan: subscriptionPlanEnum.optional(),
    search: z.string().trim().max(120).optional(),
  })
  .strict();