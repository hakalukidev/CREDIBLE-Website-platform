/**
 * Admin-extended module schemas.
 *
 * Schemas for the new admin endpoints — user management, business/professional
 * admin indexes, payment refunds, subscription mutations, contact-request
 * triage, audit log filter, settings editor.
 */
import { z } from 'zod';

// ----------------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------------

export const adminUserRole = z.enum([
  'CUSTOMER',
  'BUSINESS',
  'PROFESSIONAL',
  'ADMIN',
]);

export const adminUserStatus = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'DELETED',
]);

export const adminListUsersSchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    role: adminUserRole.optional(),
    status: adminUserStatus.optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type AdminListUsersQuery = z.infer<typeof adminListUsersSchema>;

export const adminUpdateUserSchema = z
  .object({
    role: adminUserRole.optional(),
    status: adminUserStatus.optional(),
  })
  .strict()
  .refine((d) => d.role !== undefined || d.status !== undefined, {
    message: 'Provide at least one field to update',
  });

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

// ----------------------------------------------------------------------------
// Businesses / professionals (admin indexes)
// ----------------------------------------------------------------------------

export const adminListBusinessesSchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    status: z
      .enum(['DRAFT', 'PENDING', 'PUBLISHED', 'SUSPENDED', 'CLOSED'])
      .optional(),
    verificationStatus: z
      .enum(['NOT_STARTED', 'PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED', 'APPROVED', 'REJECTED'])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type AdminListBusinessesQuery = z.infer<typeof adminListBusinessesSchema>;

export const adminListProfessionalsSchema = adminListBusinessesSchema;
export type AdminListProfessionalsQuery = z.infer<typeof adminListProfessionalsSchema>;

// ----------------------------------------------------------------------------
// Payments
// ----------------------------------------------------------------------------

// `adminListPaymentsSchema` / `adminListSubscriptionsSchema` are defined in
// `./payment.ts` so the billing module has a single source of truth. They're
// re-exported through `./index.ts` and imported directly by the admin
// module.

export const adminRefundPaymentSchema = z
  .object({
    amount: z.number().positive().optional(),
    reason: z.string().trim().min(5).max(1000),
  })
  .strict();

export type AdminRefundPaymentInput = z.infer<typeof adminRefundPaymentSchema>;

export const adminCancelSubscriptionSchema = z
  .object({
    reason: z.string().trim().min(5).max(1000),
  })
  .strict();

export type AdminCancelSubscriptionInput = z.infer<typeof adminCancelSubscriptionSchema>;

export const adminOverrideSubscriptionSchema = z
  .object({
    plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
    validUntil: z.coerce.date().optional(),
  })
  .strict();

export type AdminOverrideSubscriptionInput = z.infer<
  typeof adminOverrideSubscriptionSchema
>;

// ----------------------------------------------------------------------------
// Contact requests
// ----------------------------------------------------------------------------

export const adminListContactRequestsSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'REJECTED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type AdminListContactRequestsQuery = z.infer<
  typeof adminListContactRequestsSchema
>;

export const adminUpdateContactRequestSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'REJECTED']).optional(),
    response: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((d) => d.status !== undefined || d.response !== undefined, {
    message: 'Provide at least one field to update',
  });

export type AdminUpdateContactRequestInput = z.infer<
  typeof adminUpdateContactRequestSchema
>;

// ----------------------------------------------------------------------------
// Audit logs
// ----------------------------------------------------------------------------

export const adminListAuditLogsSchema = z
  .object({
    actorId: z.string().optional(),
    action: z.string().trim().max(120).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export type AdminListAuditLogsQuery = z.infer<typeof adminListAuditLogsSchema>;

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

export const adminUpdateSettingSchema = z
  .object({
    value: z.unknown(),
  })
  .strict();

export type AdminUpdateSettingInput = z.infer<typeof adminUpdateSettingSchema>;