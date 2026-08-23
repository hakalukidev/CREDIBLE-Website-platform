import { Router } from 'express';
import {
  createBusinessSchema,
  updateBusinessSchema,
  searchBusinessesSchema,
} from '@credible/shared';
import { validate } from '../../middleware/validate';
import { authRequired, requireRole, ensureActiveUser } from '../../middleware/auth';
import { businessController } from './business.controller';

const router = Router();

// Public
router.get('/search', validate(searchBusinessesSchema, 'query'), businessController.search);
router.get('/id/:id', businessController.getById); // Phase 2 — used by /submit-review/[businessId]
router.get('/:slug', businessController.getBySlug);

// Owner-scoped
router.post(
  '/',
  authRequired,
  ensureActiveUser,
  requireRole('BUSINESS'),
  validate(createBusinessSchema),
  businessController.create,
);
// NOTE: `/me/*` endpoints live in `me.routes.ts` (mounted separately in
// `routes/index.ts`) so they share the requireRole + authRequired middleware.
router.patch(
  '/:id',
  authRequired,
  ensureActiveUser,
  requireRole('BUSINESS', 'ADMIN'),
  validate(updateBusinessSchema),
  businessController.update,
);
router.post(
  '/:id/publish',
  authRequired,
  ensureActiveUser,
  requireRole('BUSINESS'),
  businessController.publish,
);

export { router as businessRouter };
export default router;