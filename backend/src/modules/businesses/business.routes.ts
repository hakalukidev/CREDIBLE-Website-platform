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
//
// CUSTOMER is intentionally allowed here: a fresh sign-up is always
// CUSTOMER, and the user can promote themselves to BUSINESS by creating
// a business profile (the role upgrade happens atomically inside
// `businessService.create`).
router.post(
  '/',
  authRequired,
  ensureActiveUser,
  requireRole('BUSINESS', 'CUSTOMER'),
  validate(createBusinessSchema),
  businessController.create,
);
// NOTE: `/me/*` endpoints live in `me.routes.ts` (mounted separately in
// `routes/index.ts`) so they share the requireRole + authRequired middleware.
router.patch(
  '/:id',
  authRequired,
  ensureActiveUser,
  // CUSTOMER is allowed so a freshly-upgraded owner can edit their
  // profile in the brief window before the JWT is refreshed; the
  // service-layer ownership check is the real gate.
  requireRole('BUSINESS', 'CUSTOMER', 'ADMIN'),
  validate(updateBusinessSchema),
  businessController.update,
);
router.post(
  '/:id/publish',
  // CUSTOMER is permitted here in addition to BUSINESS: a freshly created
  // business upgrades the user from CUSTOMER → BUSINESS atomically inside
  // `businessService.create`, but the JWT used to call this endpoint still
  // carries the old role until it's refreshed. The owner check inside
  // `businessService.publish` is what actually enforces security.
  authRequired,
  ensureActiveUser,
  requireRole('BUSINESS', 'CUSTOMER'),
  businessController.publish,
);

export { router as businessRouter };
export default router;