import { z } from 'zod';
import {
  REVIEW_MAX_CONTENT_LENGTH,
  REVIEW_MAX_RATING,
  REVIEW_MAX_TITLE_LENGTH,
  REVIEW_MIN_CONTENT_LENGTH,
  REVIEW_MIN_RATING,
  REVIEW_FLAG_REASONS,
} from '../constants/roles';

export const createReviewSchema = z
  .object({
    businessId: z.string().cuid(),
    rating: z
      .number()
      .int()
      .min(REVIEW_MIN_RATING, 'Rating must be at least 1')
      .max(REVIEW_MAX_RATING, 'Rating must be at most 5'),
    title: z.string().trim().min(3).max(REVIEW_MAX_TITLE_LENGTH).optional(),
    content: z
      .string()
      .trim()
      .min(REVIEW_MIN_CONTENT_LENGTH)
      .max(REVIEW_MAX_CONTENT_LENGTH),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.pick({ title: true, content: true, rating: true });

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const reviewResponseSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(REVIEW_MIN_CONTENT_LENGTH)
      .max(REVIEW_MAX_CONTENT_LENGTH),
  })
  .strict();

export type ReviewResponseInput = z.infer<typeof reviewResponseSchema>;

export const flagReviewSchema = z
  .object({
    reason: z.enum(REVIEW_FLAG_REASONS),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type FlagReviewInput = z.infer<typeof flagReviewSchema>;

export const listReviewsSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(['createdAt', 'rating', 'helpfulCount']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
  })
  .strict();

export type ListReviewsInput = z.infer<typeof listReviewsSchema>;

// ----------------------------------------------------------------------------
// Phase 2 additions — guest OTP review flow & business review management
// ----------------------------------------------------------------------------

/**
 * Step 1 of the guest review flow: request an OTP for email or phone.
 * The reviewer provides their identifier and the business they want to review.
 */
export const submitReviewOtpSchema = z
  .object({
    businessId: z.string().cuid('Invalid business id'),
    identifier: z
      .string()
      .trim()
      .min(3)
      .max(254)
      .refine((v) => /@/.test(v) || /^\+?[0-9 ()-]{7,20}$/.test(v), {
        message: 'Provide a valid email or phone number',
      }),
  })
  .strict();

export type SubmitReviewOtpInput = z.infer<typeof submitReviewOtpSchema>;

/**
 * Step 2: verify the OTP and submit the review in one shot. If the user
 * doesn't already exist, the server will auto-provision a `CUSTOMER` account.
 */
export const verifyReviewOtpSchema = submitReviewOtpSchema.extend({
  code: z.string().trim().regex(/^[0-9]{4,8}$/, 'Invalid code'),
  rating: z
    .number()
    .int()
    .min(REVIEW_MIN_RATING, 'Rating must be at least 1')
    .max(REVIEW_MAX_RATING, 'Rating must be at most 5'),
  title: z.string().trim().min(3).max(REVIEW_MAX_TITLE_LENGTH).optional(),
  content: z
    .string()
    .trim()
    .min(REVIEW_MIN_CONTENT_LENGTH)
    .max(REVIEW_MAX_CONTENT_LENGTH),
});

export type VerifyReviewOtpInput = z.infer<typeof verifyReviewOtpSchema>;

/**
 * Business-owner review list (filter by rating, search by content).
 */
export const ownerReviewListSchema = listReviewsSchema.extend({
  search: z.string().trim().max(200).optional(),
});

export type OwnerReviewListInput = z.infer<typeof ownerReviewListSchema>;