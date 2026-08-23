/**
 * Verification routes — Phase 3.
 *
 * All `/businesses/:businessId/verification/*` routes are wrapped with
 *   authRequired → ensureActiveUser → requireRole('BUSINESS')
 * The ownership check (business.ownerId === req.user.id) is enforced inside
 * each controller via `assertOwnsBusiness` for routes that mutate state.
 *
 * Admin routes are mounted under `/admin/verification/*` with the standard
 * admin guard chain.
 */
import { Router } from 'express';
import {
  startVerificationSchema,
  submitVerificationSchema,
  reviewVerificationDecisionSchema,
  appealVerificationSchema,
  revokeBadgeSchema,
  cancelApplicationSchema,
  addVerificationDocumentSchema,
  adminApplicationListSchema,
} from '@credible/shared';
import { validate } from '../../middleware/validate';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { verificationController } from './verification.controller';

const router = Router();

const businessGuard = [authRequired, ensureActiveUser, requireRole('BUSINESS')] as const;
const adminGuard = [authRequired, ensureActiveUser, requireRole('ADMIN')] as const;

// ----------------------------------------------------------------------------
// Business-facing verification wizard endpoints
// ----------------------------------------------------------------------------

router.get(
  '/businesses/:businessId/verification/eligibility',
  ...businessGuard,
  verificationController.eligibility,
);

router.post(
  '/businesses/:businessId/verification/apply',
  ...businessGuard,
  validate(startVerificationSchema),
  verificationController.apply,
);

router.get(
  '/businesses/:businessId/verification',
  ...businessGuard,
  verificationController.status,
);

router.get(
  '/businesses/:businessId/verification/applications',
  ...businessGuard,
  verificationController.listMine,
);

router.get(
  '/businesses/:businessId/verification/applications/:applicationId',
  ...businessGuard,
  verificationController.getApplication,
);

router.post(
  '/businesses/:businessId/verification/applications/:applicationId/documents',
  ...businessGuard,
  validate(addVerificationDocumentSchema),
  verificationController.addDocument,
);

router.get(
  '/businesses/:businessId/verification/applications/:applicationId/documents',
  ...businessGuard,
  verificationController.listDocuments,
);

router.delete(
  '/businesses/:businessId/verification/applications/:applicationId/documents/:documentId',
  ...businessGuard,
  verificationController.deleteDocument,
);

router.post(
  '/businesses/:businessId/verification/applications/:applicationId/submit',
  ...businessGuard,
  validate(submitVerificationSchema),
  verificationController.submit,
);

router.post(
  '/businesses/:businessId/verification/applications/:applicationId/cancel',
  ...businessGuard,
  validate(cancelApplicationSchema),
  verificationController.cancel,
);

router.post(
  '/businesses/:businessId/verification/applications/:applicationId/appeal',
  ...businessGuard,
  validate(appealVerificationSchema),
  verificationController.appeal,
);

router.get(
  '/businesses/:businessId/verification/badge',
  ...businessGuard,
  verificationController.myBadge,
);

router.get(
  '/businesses/:businessId/verification/badge/embed',
  ...businessGuard,
  verificationController.badgeEmbed,
);

// ----------------------------------------------------------------------------
// Admin verification dashboard
// ----------------------------------------------------------------------------

router.get(
  '/admin/verification/stats',
  ...adminGuard,
  verificationController.adminStats,
);

router.get(
  '/admin/verification/applications',
  ...adminGuard,
  validate(adminApplicationListSchema, 'query'),
  verificationController.adminList,
);

router.get(
  '/admin/verification/applications/:applicationId',
  ...adminGuard,
  verificationController.adminGet,
);

router.get(
  '/admin/verification/applications/:applicationId/ai-analysis',
  ...adminGuard,
  verificationController.adminAiAnalysis,
);

router.post(
  '/admin/verification/applications/:applicationId/decide',
  ...adminGuard,
  validate(reviewVerificationDecisionSchema),
  verificationController.adminDecide,
);

router.post(
  '/admin/verification/businesses/:businessId/revoke',
  ...adminGuard,
  validate(revokeBadgeSchema),
  verificationController.adminRevoke,
);

export { router as verificationRouter };
export default router;