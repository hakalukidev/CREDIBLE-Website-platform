import { z } from 'zod';
import {
  VERIFICATION_ALLOWED_MIME,
  VERIFICATION_MAX_FILE_BYTES,
} from '../constants/verification';

export const DOCUMENT_TYPES = [
  'TRADE_LICENSE',
  'NATIONAL_ID',
  'TAX_CERTIFICATE',
  'BUSINESS_REGISTRATION',
  'ADDRESS_PROOF',
  'PROFESSIONAL_LICENSE',
  'OTHER',
] as const;

export const startVerificationSchema = z
  .object({
    level: z.enum(['BASIC', 'CERTIFIED', 'PREMIUM']).default('BASIC'),
    type: z.enum(['BASIC', 'PREMIUM']).default('BASIC'),
    documentTypes: z.array(z.enum(DOCUMENT_TYPES)).min(1).optional(),
  })
  .strict();

export type StartVerificationInput = z.infer<typeof startVerificationSchema>;

export const submitVerificationSchema = z
  .object({
    additionalNotes: z.string().trim().max(2000).optional(),
  })
  .strict()
  .default({});

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

export const reviewVerificationDecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().max(1000).optional(),
    badgeType: z.enum(['BASIC', 'CERTIFIED', 'PREMIUM']).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((d) => d.decision === 'APPROVE' || Boolean(d.reason), {
    message: 'Rejection reason is required',
    path: ['reason'],
  });

export type ReviewVerificationDecision = z.infer<typeof reviewVerificationDecisionSchema>;

export const appealVerificationSchema = z
  .object({
    reason: z.string().trim().min(10).max(2000),
  })
  .strict();

export type AppealVerificationInput = z.infer<typeof appealVerificationSchema>;

export const revokeBadgeSchema = z
  .object({
    reason: z.string().trim().min(5).max(1000),
  })
  .strict();

export type RevokeBadgeInput = z.infer<typeof revokeBadgeSchema>;

export const cancelApplicationSchema = z
  .object({})
  .strict()
  .optional();

export type CancelApplicationInput = z.infer<typeof cancelApplicationSchema>;

export const adminApplicationListSchema = z
  .object({
    status: z
      .enum(['PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED', 'APPROVED', 'REJECTED'])
      .optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export type AdminApplicationListQuery = z.infer<typeof adminApplicationListSchema>;

export const moderationDecisionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT', 'DELETE']),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type ModerationDecisionInput = z.infer<typeof moderationDecisionSchema>;

// ----------------------------------------------------------------------------
// Phase 3 — verification document upload / single-document controller schemas
// ----------------------------------------------------------------------------

/**
 * Body posted to `POST /businesses/:businessId/verification/applications/:applicationId/documents`
 * once the client has PUT the file to the pre-signed S3/R2 URL.
 */
export const addVerificationDocumentSchema = z
  .object({
    type: z.enum(DOCUMENT_TYPES),
    fileKey: z.string().trim().min(3).max(500),
    fileUrl: z.string().trim().url().max(2048),
    mimeType: z.enum(VERIFICATION_ALLOWED_MIME),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(VERIFICATION_MAX_FILE_BYTES, 'File too large (max 20 MB)'),
    originalName: z.string().trim().min(1).max(200),
    encrypt: z.boolean().optional().default(true),
  })
  .strict();

export type AddVerificationDocumentInput = z.infer<typeof addVerificationDocumentSchema>;

/**
 * Narrow type reused inside the verification service to avoid leaking the
 * Prisma row into callers.
 */
export type DocInput = AddVerificationDocumentInput;
