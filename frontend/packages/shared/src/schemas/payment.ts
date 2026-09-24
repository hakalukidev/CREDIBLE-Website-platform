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

export const planAudienceEnum = z.enum(['ALL', 'BUSINESS', 'PROFESSIONAL']);

/**
 * Upsert payload for the admin pricing-plans manager.
 * Identifies a row by its `code` (FREE | BASIC | PROFESSIONAL | ENTERPRISE);
 * every other field is optional so a partial PATCH keeps the existing
 * values. The admin form sends the full row on save for predictability.
 */
export const adminUpsertPlanSchema = z
  .object({
    code: subscriptionPlanEnum,
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    priceYearly: z.number().nonnegative().max(1_000_000).optional(),
    priceMonthly: z.number().nonnegative().max(1_000_000).optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toUpperCase())
      .optional(),
    audience: planAudienceEnum.optional(),
    highlights: z.array(z.string().trim().min(1).max(140)).max(20).optional(),
    ctaLabel: z.string().trim().min(1).max(40).nullable().optional(),
    hasBadge: z.boolean().optional(),
    hasVerification: z.boolean().optional(),
    isActive: z.boolean().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
  })
  .strict();

export type AdminUpsertPlanInput = z.infer<typeof adminUpsertPlanSchema>;