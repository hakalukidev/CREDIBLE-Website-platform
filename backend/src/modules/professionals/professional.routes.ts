import { Router } from 'express';
import {
  createProfessionalSchema,
  searchProfessionalsSchema,
  updateProfessionalSchema,
} from '@credible/shared';
import { validate } from '../../middleware/validate';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { professionalController } from './professional.controller';
import { meProfessionalController } from './me.controller';

const router = Router();

// Public
router.get('/search', validate(searchProfessionalsSchema, 'query'), professionalController.search);
router.get('/slug/:slug', professionalController.getBySlug);
router.get('/id/:id', professionalController.getById);

// Owner-scoped — `/me` shorthand
// CUSTOMER is allowed on all of these because every controller
// resolves the caller's owned professional profile from the JWT
// subject and 404s if none exists. The owner check is the real
// security gate; the role gate is here only to keep non-owners
// out before the lookup runs.
router.get('/me/profile', authRequired, ensureActiveUser, requireRole('PROFESSIONAL', 'CUSTOMER', 'ADMIN'), meProfessionalController.getMine);
router.patch(
  '/me/profile',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'CUSTOMER', 'ADMIN'),
  validate(updateProfessionalSchema),
  meProfessionalController.updateMine,
);
router.post(
  '/me/publish',
  // CUSTOMER is permitted here in addition to PROFESSIONAL for the same
  // JWT-still-says-CUSTOMER reason documented on `/professionals/:id/publish`.
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'CUSTOMER'),
  meProfessionalController.publishMine,
);
router.get(
  '/me/reviews',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'CUSTOMER', 'ADMIN'),
  meProfessionalController.listReviews,
);

// Owner-scoped on `/professionals` (id)
//
// CUSTOMER is intentionally allowed on POST `/`: a fresh sign-up is
// always CUSTOMER and the role is upgraded to PROFESSIONAL atomically
// inside `professionalService.create` when their first professional
// profile is created.
router.post(
  '/',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'CUSTOMER', 'ADMIN'),
  validate(createProfessionalSchema),
  professionalController.create,
);
router.patch(
  '/:id',
  authRequired,
  ensureActiveUser,
  // CUSTOMER is allowed so a freshly-upgraded owner can edit their
  // profile in the brief window before the JWT is refreshed; the
  // service-layer ownership check is the real gate.
  requireRole('PROFESSIONAL', 'CUSTOMER', 'ADMIN'),
  validate(updateProfessionalSchema),
  professionalController.update,
);
router.post(
  '/:id/publish',
  // CUSTOMER is permitted here in addition to PROFESSIONAL: a freshly created
  // professional profile upgrades the user from CUSTOMER → PROFESSIONAL
  // atomically inside `professionalService.create`, but the JWT used to
  // call this endpoint still carries the old role until it's refreshed.
  // The owner check inside `professionalService.publish` is what actually
  // enforces security.
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'CUSTOMER'),
  professionalController.publish,
);

export { router as professionalRouter };
export default router;
