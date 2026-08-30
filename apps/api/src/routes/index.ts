import { Router } from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { authRouter } from '../modules/auth/auth.routes';
import { businessRouter } from '../modules/businesses/business.routes';
import { meRouter } from '../modules/businesses/me.routes';
import { reviewRouter } from '../modules/reviews/review.routes';
import { verificationRouter } from '../modules/verification/verification.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { uploadRouter } from '../modules/upload/upload.controller';
import { paymentRouter } from '../modules/payments/payment.controller';
import { contactRouter } from '../modules/contact/contact.controller';
import { publicVerificationRouter } from '../modules/verification/public.routes';
import { userRouter } from '../modules/users/users.routes';
import { subscriptionRouter } from '../modules/subscriptions/subscriptions.routes';
import { categoryRouter } from '../modules/categories/categories.routes';
import { billingRouter } from '../modules/admin/voucher.controller';
import { publicApiRouter } from '../modules/public/public.routes';
import { adminAnalyticsRouter } from '../modules/admin/analytics.routes';
import { businessAnalyticsRouter } from '../modules/businesses/analytics.routes';
import { env } from '../config/env';

export function buildRouter(): Router {
  const router = Router();

  // Health
router.get('/health', async (_req, res) => {
  try {
    // Lightweight DB ping for liveness/readiness.
    const { prisma } = await import('../lib/db/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'credible-api',
        version: '0.1.0',
        env: env.NODE_ENV,
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: { code: 'NOT_READY', message: 'Database unavailable' },
    });
  }
});

  router.use('/auth', authRouter);
  router.use('/users', userRouter);
  router.use('/businesses', businessRouter);
  // Phase 2 — owner-scoped dashboard endpoints. Mounted under the same
  // `/businesses` prefix so paths stay consistent with the existing route
  // shape (`/businesses/me/profile`, `/businesses/me/reviews/...`).
  router.use('/businesses/me', meRouter);
  router.use('/businesses/me', businessAnalyticsRouter);
  router.use('/categories', categoryRouter);
  router.use('/', reviewRouter); // /businesses/:id/reviews and /reviews/*
  router.use('/', contactRouter);
  router.use('/', verificationRouter);
  router.use('/', uploadRouter);

  // Phase 4 — payments gateway + owner-facing subscription endpoints.
  router.use('/payments', paymentRouter);
  router.use('/business/subscription', subscriptionRouter);

  // Phase 4 — admin billing & vouchers (nested under /admin/billing).
  router.use('/admin', adminRouter);
  router.use('/admin', adminAnalyticsRouter);
  router.use('/admin/billing', billingRouter);

  router.use('/', publicVerificationRouter); // /verify/:hash (public)

  // Phase 5 — public REST API for third-party widgets and integrations.
  router.use('/', publicApiRouter);

  // OpenAPI spec — served as a static asset for docs tooling.
  // __dirname is src/routes in dev (tsx, unbundled) but dist/ in production
  // (esbuild bundles everything into a single dist/server.js), so the file
  // sits a different number of directories up depending on how we're run.
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const openapiCandidates = [
    join(__dirname, '..', 'openapi.yaml'),
    join(__dirname, '..', '..', 'openapi.yaml'),
  ];
  const openapiPath = openapiCandidates.find(existsSync) ?? openapiCandidates[0];
  const openapiSpec = readFileSync(openapiPath, 'utf8');
  router.get('/openapi.yaml', (_req, res) => {
    res.type('text/yaml').send(openapiSpec);
  });

  return router;
}