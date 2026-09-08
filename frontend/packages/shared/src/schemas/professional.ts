import { z } from 'zod';
import { BUSINESS_NAME_MAX_LENGTH, BUSINESS_NAME_MIN_LENGTH } from '../constants/roles';

export const professionalStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'PUBLISHED',
  'SUSPENDED',
  'CLOSED',
]);

export const createProfessionalSchema = z
  .object({
    title: z.string().trim().min(1).max(20).optional(),
    displayName: z
      .string()
      .trim()
      .min(BUSINESS_NAME_MIN_LENGTH)
      .max(BUSINESS_NAME_MAX_LENGTH),
    headline: z.string().trim().max(140).optional(),
    bio: z.string().trim().max(2000).optional(),
    profession: z.string().trim().min(2).max(80),
    specialties: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    avatar: z.string().trim().url().optional(),
    coverImage: z.string().trim().url().optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/)
      .optional(),
    website: z.string().trim().url().optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    categoryId: z.string().trim().min(1).optional(),
  })
  .strict();

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;

export const updateProfessionalSchema = createProfessionalSchema.partial();
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;

export const searchProfessionalsSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    profession: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    categoryId: z.string().trim().optional(),
    verifiedOnly: z.coerce.boolean().optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    page: z.coerce.number().int().positive().default(1),
    perPage: z.coerce.number().int().positive().max(50).default(20),
  })
  .strict();

export type SearchProfessionalsInput = z.infer<typeof searchProfessionalsSchema>;
