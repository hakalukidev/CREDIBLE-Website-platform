import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constants/roles';

export const emailSchema = z.string().trim().toLowerCase().email('Invalid email address').max(254);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/u, 'Invalid phone number')
  .optional();

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[a-z]/, 'Must include at least one lowercase letter')
  .regex(/[0-9]/, 'Must include at least one digit');

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: phoneSchema,
    role: z.enum(['CUSTOMER', 'BUSINESS']).default('CUSTOMER'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    rememberMe: z.boolean().optional(),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const requestOtpSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema,
    purpose: z.enum(['email_verify', 'phone_verify', 'login', 'review']),
  })
  .strict()
  .refine((d) => Boolean(d.email ?? d.phone), {
    message: 'Either email or phone is required',
  });

export const verifyOtpSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema,
    code: z.string().trim().regex(/^[0-9]{4,8}$/, 'Invalid code'),
    purpose: z.enum(['email_verify', 'phone_verify', 'login', 'review']),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(20).max(2048),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(512),
    password: passwordSchema,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  })
  .strict();