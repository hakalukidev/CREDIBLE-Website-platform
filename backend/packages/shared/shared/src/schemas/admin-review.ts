/**
 * Admin reviews module schemas.
 *
 * Schemas for the review moderation queue, per-review admin actions
 * (respond, resolve flag, force status), and filter shapes.
 */
import { z } from 'zod';

export const adminListReviewsSchema = z
  .object({
    status: z
      .enum(['PUBLISHED', 'FLAGGED', 'HIDDEN', 'DELETED', 'PENDING_MODERATION'])
      .optional(),
    targetType: z.enum(['BUSINESS', 'PROFESSIONAL']).optional(),
    search: z.string().trim().max(200).optional(),
    minRating: z.coerce.number().int().min(1).max(5).optional(),
    maxRating: z.coerce.number().int().min(1).max(5).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type AdminListReviewsQuery = z.infer<typeof adminListReviewsSchema>;

export const adminRespondReviewSchema = z
  .object({
    message: z.string().trim().min(5).max(2000),
  })
  .strict();

export type AdminRespondReviewInput = z.infer<typeof adminRespondReviewSchema>;

export const adminResolveReviewFlagSchema = z
  .object({
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export type AdminResolveReviewFlagInput = z.infer<
  typeof adminResolveReviewFlagSchema
>;

export const adminForceReviewStatusSchema = z
  .object({
    status: z.enum(['PUBLISHED', 'HIDDEN', 'PENDING_MODERATION']),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export type AdminForceReviewStatusInput = z.infer<
  typeof adminForceReviewStatusSchema
>;