import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Redis — REDIS_URL takes precedence when set (managed providers like
  // Render/Railway expose a single connection string rather than
  // separate host/port/password fields).
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),

  // S3/R2
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('credible-documents'),
  S3_PUBLIC_BUCKET: z.string().default('credible-public'),
  /**
   * Custom public domain for the public bucket (e.g. R2 public dev URL,
   * CloudFront distribution, or a CDN URL). When set, public objects are
   * served from this base instead of the raw S3/R2 endpoint.
   */
  S3_PUBLIC_BUCKET_URL: z.string().url().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:4000/api/v1/auth/google/callback'),
  // Google Places API (classic). Optional — without it, places/photo helpers throw clearly.
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z
    .string()
    .default('http://localhost:4000/api/v1/auth/facebook/callback'),

  // SMTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('Credible <noreply@credible.example>'),

  // OTP
  OTP_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(600),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),

  // Rate limit
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // AI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // Payments
  AAMARPAY_STORE_ID: z.string().optional(),
  AAMARPAY_SIGNATURE_KEY: z.string().optional(),
  AAMARPAY_SANDBOX: z.coerce.boolean().default(true),
  AAMARPAY_SUCCESS_URL: z.string().url().optional(),
  AAMARPAY_FAIL_URL: z.string().url().optional(),
  AAMARPAY_CANCEL_URL: z.string().url().optional(),

  SSLCZ_STORE_ID: z.string().optional(),
  SSLCZ_STORE_PASSWORD: z.string().optional(),
  SSLCZ_SANDBOX: z.coerce.boolean().default(true),
  SSLCZ_SUCCESS_URL: z.string().url().optional(),
  SSLCZ_FAIL_URL: z.string().url().optional(),
  SSLCZ_CANCEL_URL: z.string().url().optional(),
  SSLCZ_IPN_URL: z.string().url().optional(),

  // Invoicing
  INVOICE_VAT_RATE: z.coerce.number().min(0).max(1).default(0.05),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDev = env.NODE_ENV === 'development';