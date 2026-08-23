/**
 * Verification service — Phase 3.
 *
 * Workflow:
 *   apply()        → creates an application row in PENDING
 *   upload()       → appends a document record (storage + AI worker is queued)
 *   listDocs()     → documents attached to an application
 *   deleteDoc()    → remove a document before submission
 *   submit()       → PENDING → SUBMITTED → AUTO_CHECKING (queue analysis)
 *   cancel()       → PENDING|* → REJECTED (locally — only the owner can cancel)
 *   appeal()       → REJECTED → PENDING (re-enters queue)
 *   decide()       → admin approves or rejects an application
 *   revoke()       → admin revokes an issued badge
 *   eligibility()  → checks the current business's review count + rating
 */
import { prisma } from '../../lib/db/prisma';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../lib/errors/AppError';
import { generateBadgeHash } from '@credible/shared/utils/crypto';
import type {
  VerificationStatus,
  VerificationLevel,
} from '@credible/types';
import type {
  AppealVerificationInput,
  CancelApplicationInput,
  DocInput,
  SubmitVerificationInput,
  ReviewVerificationDecision,
} from '@credible/shared';
import {
  VERIFICATION_MAX_DOCUMENTS,
  VERIFICATION_MIN_DOCUMENTS,
  VERIFICATION_REVIEW_SLA_DAYS,
} from '@credible/shared';
import type { VerificationApplication, VerificationDocument, Business } from '@prisma/client';
import { verificationRepository } from './verification.repository';
import { businessRepository } from '../businesses/business.repository';
import { queues } from '../../lib/queue/queues';
import { generateBadge } from '../../lib/badge/generator';
import { logger } from '../../lib/logger/logger';
import { env } from '../../config/env';

const ALLOWED_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  NOT_STARTED: ['PENDING'],
  PENDING: ['DOCUMENTS_UPLOADED', 'REJECTED', 'AUTO_CHECKING'],
  DOCUMENTS_UPLOADED: ['AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED'],
  AUTO_CHECKING: ['HUMAN_REVIEW_REQUIRED', 'APPROVED'],
  HUMAN_REVIEW_REQUIRED: ['APPROVED', 'REJECTED'],
  APPROVED: [], // terminal until revoke
  REJECTED: ['PENDING'], // appeal
};

function canTransition(from: VerificationStatus, to: VerificationStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

async function logStatus(
  applicationId: string,
  status: VerificationStatus,
  note?: string,
  createdBy?: string,
): Promise<void> {
  await prisma.applicationStatusHistory.create({
    data: { applicationId, status, note, createdBy },
  });
}

export type ApplicationWithDocs = VerificationApplication & {
  documents: VerificationDocument[];
  business: Business;
  statusHistory: { id: string; status: VerificationStatus; note: string | null; createdAt: Date; createdBy: string | null }[];
  aiAnalysis: {
    extractedFields: unknown;
    flags: unknown;
    confidenceScore: number;
    suggestedDecision: string;
    summary: string | null;
    modelUsed: string;
    processedAt: Date;
  } | null;
};

export const verificationService = {
  // -------------------------------------------------------------------------
  // Eligibility
  // -------------------------------------------------------------------------
  async eligibility(businessId: string) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');

    const reviewCount = await prisma.review.count({
      where: { businessId, status: 'PUBLISHED', deletedAt: null },
    });
    const avgRating = business.ratingAverage ? Number(business.ratingAverage) : 0;
    const subscription = await prisma.subscription.findFirst({
      where: { businessId, status: { in: ['ACTIVE', 'TRIALING'] } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      eligible:
        reviewCount >= 5 &&
        avgRating >= 4.0 &&
        Boolean(subscription && subscription.plan !== 'FREE'),
      checks: {
        reviewCount: { actual: reviewCount, required: 5, passed: reviewCount >= 5 },
        avgRating: { actual: avgRating, required: 4.0, passed: avgRating >= 4.0 },
        plan: {
          plan: subscription?.plan ?? 'FREE',
          passed: Boolean(subscription && subscription.plan !== 'FREE'),
        },
      },
      alreadyVerified: business.verificationStatus === 'APPROVED',
    };
  },

  // -------------------------------------------------------------------------
  // Apply / upload / submit / cancel / appeal
  // -------------------------------------------------------------------------
  async apply(
    ownerId: string,
    businessId: string,
    input: { level: VerificationLevel; type: 'BASIC' | 'PREMIUM' },
  ): Promise<ApplicationWithDocs> {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    if (business.ownerId !== ownerId) throw new ForbiddenError();

    if (business.verificationStatus === 'APPROVED') {
      throw new ConflictError('Business is already verified', 'ALREADY_VERIFIED');
    }
    if (!canTransition(business.verificationStatus, 'PENDING')) {
      throw new BadRequestError(`Cannot start verification from ${business.verificationStatus}`);
    }

    const application = await prisma.verificationApplication.create({
      data: {
        businessId,
        level: input.level,
        type: input.type,
        status: 'PENDING',
        appliedAt: new Date(),
      },
    });

    await businessRepository.update(businessId, { verificationStatus: 'PENDING' });
    await logStatus(application.id, 'PENDING', 'Application created', ownerId);
    return this.getApplication(application.id);
  },

  async status(businessId: string) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    const latest = await prisma.verificationApplication.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        submittedAt: true,
        reviewedAt: true,
        level: true,
        estimatedReviewAt: true,
      },
    });
    return {
      status: business.verificationStatus,
      application: latest,
    };
  },

  async getApplication(applicationId: string): Promise<ApplicationWithDocs> {
    const app = await prisma.verificationApplication.findUnique({
      where: { id: applicationId },
      include: {
        documents: { orderBy: { uploadedAt: 'asc' } },
        business: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        aiAnalysis: true,
      },
    });
    if (!app) throw new NotFoundError('Application');
    return app as ApplicationWithDocs;
  },

  async listMyApplications(businessId: string) {
    return prisma.verificationApplication.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { documents: { select: { id: true, type: true, status: true } } },
    });
  },

  async addDocument(
    businessId: string,
    applicationId: string,
    doc: DocInput,
  ): Promise<VerificationDocument> {
    const app = await this.getApplication(applicationId);
    if (app.businessId !== businessId) throw new ForbiddenError('Not your application');
    if (!['PENDING', 'DOCUMENTS_UPLOADED'].includes(app.status)) {
      throw new BadRequestError(`Cannot upload to ${app.status} application`);
    }
    const existing = await prisma.verificationDocument.count({ where: { applicationId } });
    if (existing >= VERIFICATION_MAX_DOCUMENTS) {
      throw new BadRequestError(`Maximum ${VERIFICATION_MAX_DOCUMENTS} documents reached`);
    }

    const created = await prisma.verificationDocument.create({
      data: {
        businessId,
        applicationId,
        type: doc.type,
        status: 'UPLOADED',
        fileKey: doc.fileKey,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        originalName: doc.originalName,
        encrypted: doc.encrypt ?? true,
      },
    });

    if (app.status === 'PENDING') {
      await prisma.verificationApplication.update({
        where: { id: applicationId },
        data: { status: 'DOCUMENTS_UPLOADED' },
      });
      await businessRepository.update(businessId, {
        verificationStatus: 'DOCUMENTS_UPLOADED',
      });
      await logStatus(applicationId, 'DOCUMENTS_UPLOADED', 'First document uploaded');
    }

    // queue per-document AI extraction
    await queues['process-document'].add('process-document', { documentId: created.id });

    return created;
  },

  async listDocuments(applicationId: string, businessId: string): Promise<VerificationDocument[]> {
    const app = await this.getApplication(applicationId);
    if (app.businessId !== businessId) throw new ForbiddenError('Not your application');
    return prisma.verificationDocument.findMany({
      where: { applicationId },
      orderBy: { uploadedAt: 'asc' },
    });
  },

  async deleteDocument(applicationId: string, documentId: string, businessId: string) {
    const app = await this.getApplication(applicationId);
    if (app.businessId !== businessId) throw new ForbiddenError('Not your application');
    if (!['PENDING', 'DOCUMENTS_UPLOADED'].includes(app.status)) {
      throw new BadRequestError(`Cannot delete documents from ${app.status} application`);
    }
    const doc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.applicationId !== applicationId) {
      throw new NotFoundError('Document');
    }
    await prisma.verificationDocument.delete({ where: { id: documentId } });
    return { deleted: true };
  },

  async submit(
    ownerId: string,
    applicationId: string,
    input: SubmitVerificationInput,
  ): Promise<ApplicationWithDocs> {
    const app = await this.getApplication(applicationId);
    const business = await businessRepository.findById(app.businessId);
    if (!business || business.ownerId !== ownerId) throw new ForbiddenError();

    if (!['PENDING', 'DOCUMENTS_UPLOADED'].includes(app.status)) {
      throw new BadRequestError(`Cannot submit from ${app.status}`);
    }

    if (app.documents.length < VERIFICATION_MIN_DOCUMENTS) {
      throw new BadRequestError(
        `At least ${VERIFICATION_MIN_DOCUMENTS} documents are required (you uploaded ${app.documents.length}).`,
        'INSUFFICIENT_DOCUMENTS',
      );
    }

    const updated = await prisma.verificationApplication.update({
      where: { id: applicationId },
      data: {
        status: 'AUTO_CHECKING',
        submittedAt: new Date(),
        estimatedReviewAt: new Date(
          Date.now() + VERIFICATION_REVIEW_SLA_DAYS * 24 * 60 * 60 * 1000,
        ),
        additionalNotes: input.additionalNotes,
      },
    });
    await businessRepository.update(app.businessId, { verificationStatus: 'AUTO_CHECKING' });
    await logStatus(applicationId, 'DOCUMENTS_UPLOADED', 'Submitted for review', ownerId);
    await logStatus(applicationId, 'AUTO_CHECKING', 'AI analysis started');

    // Run application-level analysis asynchronously.
    await queues['analyze-application'].add('analyze-application', { applicationId });
    // Notify the applicant.
    if (business.email) {
      await queues['verification-notification'].add('verification-status-changed', {
        applicationId,
        status: 'SUBMITTED',
      });
    }
    return this.getApplication(updated.id);
  },

  async cancel(
    ownerId: string,
    applicationId: string,
    _input?: CancelApplicationInput,
  ): Promise<ApplicationWithDocs> {
    const app = await this.getApplication(applicationId);
    const business = await businessRepository.findById(app.businessId);
    if (!business || business.ownerId !== ownerId) throw new ForbiddenError();
    if (!['PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING'].includes(app.status)) {
      throw new BadRequestError(`Cannot cancel a ${app.status} application`);
    }

    await prisma.verificationApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED', rejectionReason: 'Cancelled by applicant' },
    });
    await businessRepository.update(app.businessId, { verificationStatus: 'REJECTED' });
    await logStatus(applicationId, 'REJECTED', 'Cancelled by applicant', ownerId);
    return this.getApplication(applicationId);
  },

  async appeal(
    ownerId: string,
    applicationId: string,
    input: AppealVerificationInput,
  ): Promise<ApplicationWithDocs> {
    const app = await this.getApplication(applicationId);
    const business = await businessRepository.findById(app.businessId);
    if (!business || business.ownerId !== ownerId) throw new ForbiddenError();
    if (app.status !== 'REJECTED') {
      throw new BadRequestError('Only rejected applications can be appealed');
    }

    await prisma.verificationApplication.update({
      where: { id: applicationId },
      data: { status: 'PENDING', rejectionReason: null },
    });
    await businessRepository.update(app.businessId, { verificationStatus: 'PENDING' });
    await logStatus(applicationId, 'PENDING', `Appeal: ${input.reason}`, ownerId);
    return this.getApplication(applicationId);
  },

  // -------------------------------------------------------------------------
  // Admin endpoints
  // -------------------------------------------------------------------------
  async listApplicationsForAdmin(filter: {
    status?: VerificationStatus;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page: number;
    perPage: number;
  }) {
    const where: import('@prisma/client').Prisma.VerificationApplicationWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }
    if (filter.search) {
      where.business = {
        OR: [
          { displayName: { contains: filter.search, mode: 'insensitive' } },
          { legalName: { contains: filter.search, mode: 'insensitive' } },
          { owner: { firstName: { contains: filter.search, mode: 'insensitive' } } },
          { owner: { lastName: { contains: filter.search, mode: 'insensitive' } } },
        ],
      };
    }
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.verificationApplication.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: filter.perPage,
        include: {
          business: { select: { id: true, displayName: true, slug: true, ownerId: true } },
          documents: { select: { id: true, type: true, status: true } },
        },
      }),
      prisma.verificationApplication.count({ where }),
    ]);
    return { items, total };
  },

  async adminStats() {
    const [total, pending, humanReview, approvedToday, rejected] = await Promise.all([
      prisma.verificationApplication.count(),
      prisma.verificationApplication.count({
        where: { status: { in: ['PENDING', 'DOCUMENTS_UPLOADED'] } },
      }),
      prisma.verificationApplication.count({ where: { status: 'HUMAN_REVIEW_REQUIRED' } }),
      prisma.verificationApplication.count({
        where: { status: 'APPROVED', reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.verificationApplication.count({ where: { status: 'REJECTED' } }),
    ]);
    // Compute average review time (submittedAt → reviewedAt) in hours.
    const reviewed = await prisma.verificationApplication.findMany({
      where: { reviewedAt: { not: null }, submittedAt: { not: null } },
      select: { submittedAt: true, reviewedAt: true },
      orderBy: { reviewedAt: 'desc' },
      take: 100,
    });
    const totalMs = reviewed.reduce((acc, r) => {
      const diff = (r.reviewedAt!.getTime() - r.submittedAt!.getTime());
      return acc + Math.max(0, diff);
    }, 0);
    const avgHours = reviewed.length ? totalMs / reviewed.length / (60 * 60 * 1000) : 0;
    return {
      totalApplications: total,
      pendingReview: pending + humanReview,
      approvedToday,
      rejectionRate: total ? Math.round((rejected / total) * 100) : 0,
      averageReviewHours: Number(avgHours.toFixed(2)),
    };
  },

  async decide(
    adminId: string,
    applicationId: string,
    decision: ReviewVerificationDecision,
  ): Promise<ApplicationWithDocs> {
    const app = await this.getApplication(applicationId);
    if (!['AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED', 'DOCUMENTS_UPLOADED'].includes(app.status)) {
      throw new BadRequestError(`Cannot decide on ${app.status}`);
    }

    if (decision.decision === 'APPROVE') {
      const badgeId = generateBadgeHash();
      const badgeLevel: VerificationLevel =
        (decision.badgeType as VerificationLevel) ?? app.level;

      // Issue the canonical Badge row.
      const business = app.business;
      const verificationUrl = `${env.WEB_URL}/verify/${badgeId}`;
      await prisma.badge.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          badgeId,
          type: badgeLevel,
          verificationUrl,
        },
        update: {
          badgeId,
          type: badgeLevel,
          verificationUrl,
          isActive: true,
          revokedAt: null,
          revocationReason: null,
          issuedAt: new Date(),
        },
      });

      await prisma.verificationApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewerId: adminId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      await businessRepository.update(business.id, {
        verificationStatus: 'APPROVED',
        verificationLevel: badgeLevel,
        verifiedAt: new Date(),
        badgeHash: badgeId,
        badgeIssuedAt: new Date(),
        verificationUrl,
      });
      await logStatus(applicationId, 'APPROVED', decision.notes ?? 'Approved', adminId);
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'verification.approved',
          target: business.id,
          meta: { applicationId, level: badgeLevel },
        },
      });

      // Generate the SVG badge + queue notification.
      await queues['generate-badge'].add('issue', {
        businessId: business.id,
        badgeHash: badgeId,
      });
      await queues['verification-notification'].add('verification-status-changed', {
        applicationId,
        status: 'APPROVED',
      });
    } else {
      await prisma.verificationApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewerId: adminId,
          reviewedAt: new Date(),
          rejectionReason: decision.reason ?? 'Not provided',
        },
      });
      await businessRepository.update(app.businessId, { verificationStatus: 'REJECTED' });
      await logStatus(applicationId, 'REJECTED', decision.reason ?? 'Rejected', adminId);
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'verification.rejected',
          target: app.businessId,
          meta: { applicationId, reason: decision.reason },
        },
      });
      await queues['verification-notification'].add('verification-status-changed', {
        applicationId,
        status: 'REJECTED',
      });
    }
    return this.getApplication(applicationId);
  },

  async revoke(adminId: string, businessId: string, reason: string) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    if (business.verificationStatus !== 'APPROVED') {
      throw new BadRequestError('Business is not currently verified');
    }

    await prisma.badge.updateMany({
      where: { businessId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });
    await businessRepository.update(businessId, {
      verificationStatus: 'REJECTED',
      verificationLevel: 'NONE',
      verifiedAt: null,
      badgeHash: null,
      badgeIssuedAt: null,
    });
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'badge.revoked',
        target: businessId,
        meta: { reason },
      },
    });
    if (business.email) {
      logger.info({ businessId }, 'Badge revoked — owner notified');
    }
    return { revoked: true };
  },

  // -------------------------------------------------------------------------
  // Badge
  // -------------------------------------------------------------------------
  async badge(businessId: string) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    const badge = await prisma.badge.findUnique({ where: { businessId } });
    if (!badge || !badge.isActive) {
      return {
        hasBadge: false,
        badgeType: null,
        issuedAt: null,
        expiresAt: null,
        badgeImageUrl: null,
        verificationUrl: null,
      };
    }
    return {
      hasBadge: true,
      badgeType: badge.type,
      issuedAt: badge.issuedAt.toISOString(),
      expiresAt: badge.expiresAt?.toISOString() ?? null,
      badgeImageUrl: badge.imageUrl,
      verificationUrl: badge.verificationUrl,
      badgeId: badge.badgeId,
    };
  },

  async badgeEmbed(businessId: string) {
    const data = await this.badge(businessId);
    if (!data.hasBadge || !data.badgeId) {
      throw new BadRequestError('No active badge to embed');
    }
    const apiUrl = env.API_URL;
    const webUrl = env.WEB_URL.replace(/\/$/, '');
    const widgetUrl = `${webUrl}/widgets/badge.js`;
    const html = `<div class="credible-badge" data-business-id="${businessId}" data-badge-id="${data.badgeId}"></div>`;
    const javascript = `(function(){
  var d=document.createElement('div');
  d.className='credible-badge';
  d.setAttribute('data-business-id','${businessId}');
  d.setAttribute('data-badge-id','${data.badgeId}');
  document.currentScript.parentNode.insertBefore(d,document.currentScript);
  var s=document.createElement('script');
  s.src='${widgetUrl}';
  s.async=true;
  document.body.appendChild(s);
})();`;
    const css = `.credible-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#111827;background:#fff}.credible-badge:hover{background:#f9fafb}.credible-badge img{height:24px;display:block}`;
    return { html, javascript, css, badgeId: data.badgeId, apiUrl };
  },

  async publicLookup(badgeId: string) {
    const badge = await prisma.badge.findUnique({
      where: { badgeId },
      include: { business: { select: { id: true, displayName: true, logo: true } } },
    });
    if (!badge) return null;
    return {
      valid: badge.isActive,
      businessName: badge.business.displayName,
      badgeType: badge.type,
      issuedAt: badge.issuedAt.toISOString(),
      status: badge.isActive ? 'ACTIVE' : 'REVOKED',
      verificationUrl: badge.verificationUrl,
      revokedAt: badge.revokedAt?.toISOString() ?? null,
    };
  },

  // -------------------------------------------------------------------------
  // Backwards-compat with Phase 0/2 callers — kept as aliases.
  // -------------------------------------------------------------------------
  async startApplication(ownerId: string, businessId: string, input: { level: VerificationLevel }) {
    return this.apply(ownerId, businessId, { level: input.level, type: 'BASIC' });
  },

  async runAiReview(applicationId: string) {
    // Used by the per-document worker — keeps legacy behaviour of escalating
    // to HUMAN_REVIEW_REQUIRED so an admin always sees the case.
    const app = await this.getApplication(applicationId);
    if (!app) throw new NotFoundError('Application');
    await prisma.verificationApplication.update({
      where: { id: applicationId },
      data: { status: 'HUMAN_REVIEW_REQUIRED' },
    });
    await businessRepository.update(app.businessId, { verificationStatus: 'HUMAN_REVIEW_REQUIRED' });
    await logStatus(applicationId, 'HUMAN_REVIEW_REQUIRED', 'AI escalated to human review');
    return { escalated: true };
  },

  // legacy aliases
  async markDocumentsUploaded(businessId: string) {
    const latest = await prisma.verificationApplication.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) throw new NotFoundError('Application');
    await prisma.verificationApplication.update({
      where: { id: latest.id },
      data: { status: 'DOCUMENTS_UPLOADED' },
    });
    await businessRepository.update(businessId, { verificationStatus: 'DOCUMENTS_UPLOADED' });
    await logStatus(latest.id, 'DOCUMENTS_UPLOADED');
    return { queued: true };
  },

  async listPending() {
    return verificationRepository.listPending();
  },

  async getForBusiness(businessId: string) {
    return prisma.verificationApplication.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    });
  },
};

// ----------------------------------------------------------------------------
// DocInput / shared types (kept narrow for the upload handler).
// ----------------------------------------------------------------------------
export type { DocInput } from '@credible/shared';