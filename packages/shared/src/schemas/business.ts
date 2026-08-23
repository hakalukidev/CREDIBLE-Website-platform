import { z } from 'zod';
import {
  BUSINESS_DESCRIPTION_MAX_LENGTH,
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_NAME_MIN_LENGTH,
} from '../constants/roles';

const optionalUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createBusinessSchema = z
  .object({
    legalName: z
      .string()
      .trim()
      .min(BUSINESS_NAME_MIN_LENGTH)
      .max(BUSINESS_NAME_MAX_LENGTH),
    displayName: z
      .string()
      .trim()
      .min(BUSINESS_NAME_MIN_LENGTH)
      .max(BUSINESS_NAME_MAX_LENGTH),
    description: z.string().trim().max(BUSINESS_DESCRIPTION_MAX_LENGTH).optional(),
    categoryId: z.string().cuid('Invalid category id').optional(),
    email: z.string().trim().email().max(254).optional().or(z.literal('').transform(() => undefined)),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/u)
      .optional(),
    website: optionalUrl,
    addressLine1: z.string().trim().max(200).optional(),
    addressLine2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().length(2).default('BD'),
    yearEstablished: z
      .number()
      .int()
      .min(1800)
      .max(new Date().getFullYear())
      .optional(),
    employeeCount: z.string().trim().max(40).optional(),
  })
  .strict();

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  logo: optionalUrl,
  coverImage: optionalUrl,
  hoursJson: z.record(z.object({ open: z.string(), close: z.string() })).optional(),
  metaTitle: z.string().trim().max(160).optional(),
  metaDescription: z.string().trim().max(320).optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

export const searchBusinessesSchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    category: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    verifiedOnly: z.coerce.boolean().optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(['createdAt', 'ratingAverage', 'ratingCount', 'displayName']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .strict();

export type SearchBusinessesQuery = z.infer<typeof searchBusinessesSchema>;

// ----------------------------------------------------------------------------
// Phase 2 additions — owner-facing profile edits, invitations, presigned uploads
// ----------------------------------------------------------------------------

/**
 * Day-of-week operating hours block.
 *  - `closed` true means the business is closed.
 *  - `open` / `close` are HH:mm strings; if `closed` is true, they're ignored.
 */
export const businessHoursEntrySchema = z
  .object({
    closed: z.boolean().default(false),
    open: z
      .string()
      .regex(/^([01]?\d|2[0-3]):[0-5]\d$/u, 'Time must be HH:mm')
      .optional(),
    close: z
      .string()
      .regex(/^([01]?\d|2[0-3]):[0-5]\d$/u, 'Time must be HH:mm')
      .optional(),
  })
  .strict();

export type BusinessHoursEntry = z.infer<typeof businessHoursEntrySchema>;

export const businessHoursJsonSchema = z.record(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']), businessHoursEntrySchema);

/**
 * PATCH /businesses/me/profile — partial update. Includes `categoryIds`
 * for set-replace semantics and `hoursJson` for the per-day editor.
 */
export const businessProfileUpdateSchema = createBusinessSchema
  .partial()
  .omit({ categoryId: true })
  .extend({
    logo: optionalUrl,
    coverImage: optionalUrl,
    hoursJson: businessHoursJsonSchema.optional(),
    metaTitle: z.string().trim().max(160).optional(),
    metaDescription: z.string().trim().max(320).optional(),
    categoryIds: z.array(z.string().cuid('Invalid category id')).max(8).optional(),
  })
  .strict();

export type BusinessProfileUpdateInput = z.infer<typeof businessProfileUpdateSchema>;

export const inviteCustomerSchema = z
  .object({
    customerEmail: z.string().trim().toLowerCase().email('Invalid email').max(254),
    customerName: z.string().trim().min(1).max(80).optional(),
    message: z.string().trim().max(500).optional(),
  })
  .strict();

export type InviteCustomerInput = z.infer<typeof inviteCustomerSchema>;

/**
 * Pre-signed upload request. Server returns a one-time PUT URL the client
 * uploads the file to directly, then persists the resulting `key` in the
 * business profile (logo/cover) or document upload.
 */
export const presignUploadSchema = z
  .object({
    namespace: z.enum(['documents', 'public', 'avatars']),
    contentType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Invalid content type'),
    originalName: z.string().trim().min(1).max(200),
    size: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024, 'File too large (max 10 MB)'),
  })
  .strict();

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;