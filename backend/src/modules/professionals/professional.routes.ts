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
router.get('/me/profile', authRequired, ensureActiveUser, requireRole('PROFESSIONAL', 'ADMIN'), meProfessionalController.getMine);
router.patch(
  '/me/profile',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'ADMIN'),
  validate(updateProfessionalSchema),
  meProfessionalController.updateMine,
);
router.post(
  '/me/publish',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL'),
  meProfessionalController.publishMine,
);
router.get(
  '/me/reviews',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'ADMIN'),
  meProfessionalController.listReviews,
);

// Owner-scoped on `/professionals` (id)
router.post(
  '/',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'ADMIN'),
  validate(createProfessionalSchema),
  professionalController.create,
);
router.patch(
  '/:id',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL', 'ADMIN'),
  validate(updateProfessionalSchema),
  professionalController.update,
);
router.post(
  '/:id/publish',
  authRequired,
  ensureActiveUser,
  requireRole('PROFESSIONAL'),
  professionalController.publish,
);

export { router as professionalRouter };
export default router;
