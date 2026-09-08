import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { publicApiRateLimit } from '../../middleware/rateLimit';
import { requireApiKey, requireScope, trackApiKeyUsage } from './apiKey.middleware';
import { listReviewsQuerySchema, publicController } from './public.controller';

const router = Router();

// Health & docs (open)
router.get('/public/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'credible-public-api',
      time: new Date().toISOString(),
    },
  });
});

// All endpoints below require at least the global rate limit + (optionally) an API key.
router.use('/public', publicApiRateLimit, requireApiKey, trackApiKeyUsage);

const businessIdParam = z.object({ slugOrId: z.string().min(1).max(120) });

// Profile (single combined payload)
router.get(
  '/public/business/:slugOrId',
  validate(businessIdParam, 'params'),
  publicController.getBusiness,
);

router.get(
  '/public/business/:slugOrId/reviews',
  validate(businessIdParam, 'params'),
  validate(listReviewsQuerySchema, 'query'),
  publicController.listReviews,
);

router.get(
  '/public/business/:slugOrId/trust-score',
  validate(businessIdParam, 'params'),
  publicController.getTrustScore,
);

router.get(
  '/public/business/:slugOrId/badge',
  validate(businessIdParam, 'params'),
  publicController.getBadge,
);

router.get(
  '/public/business/:slugOrId/widget',
  validate(businessIdParam, 'params'),
  publicController.getWidget,
);

// Authenticated widget events (require widget scope).
const widgetEventSchema = z.object({ widgetType: z.string().min(1).max(32) });
router.post(
  '/public/business/:slugOrId/widget/event',
  validate(businessIdParam, 'params'),
  validate(widgetEventSchema),
  requireScope('widget.read'),
  publicController.logWidgetEvent,
);

export { router as publicApiRouter };
export default router;