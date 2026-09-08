/**
 * Verification controller — Phase 3 / Phase 5.
 *
 * Routes are split between:
 *   - business-facing endpoints (apply / upload / submit / cancel / appeal)
 *   - professional-facing endpoints (same shape, /professionals/:id/verification/*)
 *   - admin-facing endpoints (queue / decide / revoke / stats / per-document)
 *   - public endpoints (lookup badge)
 *   - badge management (image + embed code)
 *
 * Validation is handled by the `validate()` middleware so this layer is
 * purely HTTP shaping.
 */
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { startVerificationSchema } from '@credible/shared';
import { verificationService } from './verification.service';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors/AppError';
import { businessRepository } from '../businesses/business.repository';
import { prisma } from '../../lib/db/prisma';
import { storage } from '../../lib/storage/s3';

const paramsApplicationId = z.object({ applicationId: z.string().cuid() });
const paramsBusinessAndApplication = z.object({
  businessId: z.string().cuid(),
  applicationId: z.string().cuid(),
});
const paramsBusinessAndDoc = z.object({
  businessId: z.string().cuid(),
  applicationId: z.string().cuid(),
  documentId: z.string().cuid(),
});
const paramsProfessionalAndApplication = z.object({
  professionalId: z.string().cuid(),
  applicationId: z.string().cuid(),
});
const paramsProfessionalAndDoc = z.object({
  professionalId: z.string().cuid(),
  applicationId: z.string().cuid(),
  documentId: z.string().cuid(),
});
const paramsApplicationAndDoc = z.object({
  applicationId: z.string().cuid(),
  documentId: z.string().cuid(),
});

async function assertOwnsBusiness(userId: string, businessId: string): Promise<void> {
  const business = await businessRepository.findById(businessId);
  if (!business) throw new NotFoundError('Business');
  if (business.ownerId !== userId) throw new ForbiddenError('Not your business');
}

async function assertOwnsProfessional(userId: string, professionalId: string): Promise<void> {
  const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
  if (!professional) throw new NotFoundError('Professional');
  if (professional.ownerId !== userId) throw new ForbiddenError('Not your professional profile');
}

function targetTypeFromBody(req: Request): 'BUSINESS' | 'PROFESSIONAL' {
  const t = (req.body?.targetType as string | undefined)?.toUpperCase();
  return t === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'BUSINESS';
}

export const verificationController = {
  // ---------------------------------------------------------------------------
  // Business-facing
  // ---------------------------------------------------------------------------

  /** GET /businesses/:businessId/verification/eligibility */
  async eligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.eligibility(req.params.businessId as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /businesses/:businessId/verification/apply */
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.apply(
        req.user!.id,
        req.params.businessId as string,
        { ...req.body, targetType: targetTypeFromBody(req) },
      );
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /businesses/:businessId/verification */
  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.status(req.params.businessId as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /businesses/:businessId/verification/applications */
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.listMyApplications(
        req.params.businessId as string,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /businesses/:businessId/verification/applications/:applicationId */
  async getApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsApplicationId.parse(req.params);
      const data = await verificationService.getApplication(applicationId);
      if (data.businessId !== req.params.businessId) {
        throw new ForbiddenError('Not your application');
      }
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /businesses/:businessId/verification/applications/:applicationId/documents */
  async addDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsBusinessAndApplication.parse(req.params);
      const data = await verificationService.addDocument(
        req.params.businessId as string,
        applicationId,
        req.body,
        targetTypeFromBody(req),
      );
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /businesses/:businessId/verification/applications/:applicationId/documents */
  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsBusinessAndApplication.parse(req.params);
      const data = await verificationService.listDocuments(
        applicationId,
        req.params.businessId as string,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** DELETE /businesses/:businessId/verification/applications/:applicationId/documents/:documentId */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId, documentId } = paramsBusinessAndDoc.parse(req.params);
      const data = await verificationService.deleteDocument(
        applicationId,
        documentId,
        req.params.businessId as string,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /businesses/:businessId/verification/applications/:applicationId/submit */
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsBusinessAndApplication.parse(req.params);
      const data = await verificationService.submit(
        req.user!.id,
        applicationId,
        req.body ?? {},
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /businesses/:businessId/verification/applications/:applicationId/cancel */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsBusinessAndApplication.parse(req.params);
      const data = await verificationService.cancel(
        req.user!.id,
        applicationId,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /businesses/:businessId/verification/applications/:applicationId/appeal */
  async appeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsBusinessAndApplication.parse(req.params);
      const data = await verificationService.appeal(
        req.user!.id,
        applicationId,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /businesses/:businessId/verification/badge */
  async myBadge(req: Request, res: Response, next: NextFunction) {
    try {
      await assertOwnsBusiness(req.user!.id, req.params.businessId as string);
      const data = await verificationService.badge(req.params.businessId as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /businesses/:businessId/verification/badge/embed */
  async badgeEmbed(req: Request, res: Response, next: NextFunction) {
    try {
      await assertOwnsBusiness(req.user!.id, req.params.businessId as string);
      const data = await verificationService.badgeEmbed(
        req.params.businessId as string,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Professional-facing (mirror of business)
  // ---------------------------------------------------------------------------

  /** GET /professionals/:professionalId/verification/eligibility */
  async proEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.eligibility(
        req.params.professionalId as string,
        'PROFESSIONAL',
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /professionals/:professionalId/verification/apply */
  async proApply(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.apply(
        req.user!.id,
        req.params.professionalId as string,
        { ...req.body, targetType: 'PROFESSIONAL' },
      );
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /professionals/:professionalId/verification */
  async proStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.status(
        req.params.professionalId as string,
        'PROFESSIONAL',
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /professionals/:professionalId/verification/applications */
  async proListMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.listMyApplications(
        req.params.professionalId as string,
        'PROFESSIONAL',
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /professionals/:professionalId/verification/applications/:applicationId */
  async proGetApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsApplicationId.parse(req.params);
      const data = await verificationService.getApplication(applicationId);
      if (data.professionalId !== req.params.professionalId) {
        throw new ForbiddenError('Not your application');
      }
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /professionals/:professionalId/verification/applications/:applicationId/documents */
  async proAddDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsProfessionalAndApplication.parse(req.params);
      const data = await verificationService.addDocument(
        req.params.professionalId as string,
        applicationId,
        req.body,
        'PROFESSIONAL',
      );
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /professionals/:professionalId/verification/applications/:applicationId/documents */
  async proListDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsProfessionalAndApplication.parse(req.params);
      const data = await verificationService.listDocuments(
        applicationId,
        req.params.professionalId as string,
        'PROFESSIONAL',
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** DELETE /professionals/:professionalId/verification/applications/:applicationId/documents/:documentId */
  async proDeleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId, documentId } = paramsProfessionalAndDoc.parse(req.params);
      const data = await verificationService.deleteDocument(
        applicationId,
        documentId,
        req.params.professionalId as string,
        'PROFESSIONAL',
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /professionals/:professionalId/verification/applications/:applicationId/submit */
  async proSubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsProfessionalAndApplication.parse(req.params);
      const data = await verificationService.submit(
        req.user!.id,
        applicationId,
        req.body ?? {},
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /professionals/:professionalId/verification/applications/:applicationId/cancel */
  async proCancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsProfessionalAndApplication.parse(req.params);
      const data = await verificationService.cancel(
        req.user!.id,
        applicationId,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /professionals/:professionalId/verification/applications/:applicationId/appeal */
  async proAppeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsProfessionalAndApplication.parse(req.params);
      const data = await verificationService.appeal(
        req.user!.id,
        applicationId,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /professionals/:professionalId/verification/badge */
  async proBadge(req: Request, res: Response, next: NextFunction) {
    try {
      await assertOwnsProfessional(req.user!.id, req.params.professionalId as string);
      const data = await verificationService.badge(req.params.professionalId as string);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Admin-facing
  // ---------------------------------------------------------------------------

  /** GET /admin/verification/applications */
  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const perPage = Math.min(100, Number(req.query.perPage ?? 20));
      const status = req.query.status as string | undefined;
      const targetType = req.query.targetType as string | undefined;
      const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
      const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;
      const search = req.query.search as string | undefined;
      const data = await verificationService.listApplicationsForAdmin({
        status: status as never,
        targetType: targetType === 'PROFESSIONAL' ? 'PROFESSIONAL' : targetType === 'BUSINESS' ? 'BUSINESS' : undefined,
        dateFrom,
        dateTo,
        search,
        page,
        perPage,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /admin/verification/applications/:applicationId */
  async adminGet(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsApplicationId.parse(req.params);
      const data = await verificationService.getApplication(applicationId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /admin/verification/applications/:applicationId/ai-analysis */
  async adminAiAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsApplicationId.parse(req.params);
      const app = await verificationService.getApplication(applicationId);
      res.json({ success: true, data: app.aiAnalysis });
    } catch (e) {
      next(e);
    }
  },

  /** GET /admin/verification/applications/:applicationId/documents/:documentId */
  async adminGetDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId, documentId } = paramsApplicationAndDoc.parse(req.params);
      const doc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
      if (!doc || doc.applicationId !== applicationId) {
        throw new NotFoundError('Document');
      }
      // Presign a download URL (10 min) so the admin can preview the file.
      let downloadUrl: string | null = null;
      try {
        downloadUrl = await storage.presignedDownloadUrl(doc.fileKey, undefined, 600);
      } catch {
        downloadUrl = null;
      }
      res.json({
        success: true,
        data: { ...doc, downloadUrl },
      });
    } catch (e) {
      next(e);
    }
  },

  /** GET /admin/verification/documents/:documentId — flat lookup so the admin
   *  can link directly to a document without knowing its application id. */
  async adminGetDocumentFlat(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = z.string().cuid().parse(req.params.documentId);
      const doc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
      if (!doc) throw new NotFoundError('Document');
      let downloadUrl: string | null = null;
      try {
        downloadUrl = await storage.presignedDownloadUrl(doc.fileKey, undefined, 600);
      } catch {
        downloadUrl = null;
      }
      res.json({ success: true, data: { ...doc, downloadUrl } });
    } catch (e) {
      next(e);
    }
  },

  /** POST /admin/verification/applications/:applicationId/decide */
  async adminDecide(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = paramsApplicationId.parse(req.params);
      const data = await verificationService.decide(
        req.user!.id,
        applicationId,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /admin/verification/businesses/:businessId/revoke */
  async adminRevoke(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = String(req.params.businessId);
      const reason = String(req.body?.reason ?? '').trim();
      if (reason.length < 5) {
        throw new BadRequestError('Reason must be at least 5 characters');
      }
      const data = await verificationService.revoke(req.user!.id, businessId, reason, 'BUSINESS');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /admin/verification/professionals/:professionalId/revoke */
  async adminRevokeProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const professionalId = String(req.params.professionalId);
      const reason = String(req.body?.reason ?? '').trim();
      if (reason.length < 5) {
        throw new BadRequestError('Reason must be at least 5 characters');
      }
      const data = await verificationService.revoke(req.user!.id, professionalId, reason, 'PROFESSIONAL');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /admin/verification/stats */
  async adminStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await verificationService.adminStats();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  // ---------------------------------------------------------------------------
  // Public
  // ---------------------------------------------------------------------------

  /** GET /verify/:badgeId — public badge lookup */
  async publicLookup(req: Request, res: Response, next: NextFunction) {
    try {
      const badgeId = String(req.params.badgeId);
      const data = await verificationService.publicLookup(badgeId);
      if (!data) throw new NotFoundError('Badge');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};

// Re-export the start validation so route files can import the controller and
// not have to also import the schemas.
export const _verificationStartSchema = startVerificationSchema;