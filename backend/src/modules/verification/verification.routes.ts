/**
 * Verification routes — Phase 3 / Phase 5.
 *
 * Business-facing routes are mounted under `/businesses/:businessId/verification/*`
 * with the BUSINESS guard. The professional mirror is mounted under
 * `/professionals/:professionalId/verification/*` with the PROFESSIONAL guard.
 * The admin surface is under `/admin/verification/*` with the ADMIN guard.
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
const professionalGuard = [authRequired, ensureActiveUser, requireRole('PROFESSIONAL')] as const;
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
// Professional-facing verification mirror (Phase 5)
// ----------------------------------------------------------------------------

router.get(
  '/professionals/:professionalId/verification/eligibility',
  ...professionalGuard,
  verificationController.proEligibility,
);

router.post(
  '/professionals/:professionalId/verification/apply',
  ...professionalGuard,
  validate(startVerificationSchema),
  verificationController.proApply,
);

router.get(
  '/professionals/:professionalId/verification',
  ...professionalGuard,
  verificationController.proStatus,
);

router.get(
  '/professionals/:professionalId/verification/applications',
  ...professionalGuard,
  verificationController.proListMine,
);

router.get(
  '/professionals/:professionalId/verification/applications/:applicationId',
  ...professionalGuard,
  verificationController.proGetApplication,
);

router.post(
  '/professionals/:professionalId/verification/applications/:applicationId/documents',
  ...professionalGuard,
  validate(addVerificationDocumentSchema),
  verificationController.proAddDocument,
);

router.get(
  '/professionals/:professionalId/verification/applications/:applicationId/documents',
  ...professionalGuard,
  verificationController.proListDocuments,
);

router.delete(
  '/professionals/:professionalId/verification/applications/:applicationId/documents/:documentId',
  ...professionalGuard,
  verificationController.proDeleteDocument,
);

router.post(
  '/professionals/:professionalId/verification/applications/:applicationId/submit',
  ...professionalGuard,
  validate(submitVerificationSchema),
  verificationController.proSubmit,
);

router.post(
  '/professionals/:professionalId/verification/applications/:applicationId/cancel',
  ...professionalGuard,
  validate(cancelApplicationSchema),
  verificationController.proCancel,
);

router.post(
  '/professionals/:professionalId/verification/applications/:applicationId/appeal',
  ...professionalGuard,
  validate(appealVerificationSchema),
  verificationController.proAppeal,
);

router.get(
  '/professionals/:professionalId/verification/badge',
  ...professionalGuard,
  verificationController.proBadge,
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

router.get(
  '/admin/verification/applications/:applicationId/documents/:documentId',
  ...adminGuard,
  verificationController.adminGetDocument,
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

router.post(
  '/admin/verification/professionals/:professionalId/revoke',
  ...adminGuard,
  validate(revokeBadgeSchema),
  verificationController.adminRevokeProfessional,
);

// Flat document lookup — useful when the admin links to a document from a
// notification or from the audit log.
router.get(
  '/admin/verification/documents/:documentId',
  ...adminGuard,
  verificationController.adminGetDocumentFlat,
);

export { router as verificationRouter };
export default router;