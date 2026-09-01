import 'dotenv/config';
import { buildWorker } from '../lib/queue/queues';
import { sendMail, renderTemplate } from '../lib/mail/mailer';
import { logger } from '../lib/logger/logger';
import { verificationService } from '../modules/verification/verification.service';
import { businessRepository } from '../modules/businesses/business.repository';
import { generateBadge } from '../lib/badge/generator';
import { reviewRepository } from '../modules/reviews/review.repository';
import { prisma } from '../lib/db/prisma';
import { runAnalysisForApplication } from '../modules/verification/ai.service';

const emailWorker = buildWorker('email', async (job) => {
  const { template, to, vars } = job.data as { template: string; to: string; vars: Record<string, unknown> };
  if (!to) return logger.warn({ template }, 'Email skipped: no recipient');
  const { subject, html } = renderTemplate(template, vars);
  await sendMail({ to, subject, html });
});

const aiWorker = buildWorker('ai-verification', async (job) => {
  if (job.name === 'process-document') {
    const { documentId } = job.data as { documentId: string };
    logger.info({ documentId }, 'Processing document with AI');
    await prisma.verificationDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });
    // In Phase 3 a real GPT-4o vision call extracts structured fields.
    // Backbone just marks the doc as AI extracted and escalates the application to human review.
    await prisma.verificationDocument.update({
      where: { id: documentId },
      data: { status: 'AI_EXTRACTED' },
    });
    const doc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
    if (doc?.applicationId) {
      await verificationService.runAiReview(doc.applicationId);
    }
  } else if (job.name === 'analyze-application') {
    // Phase 3 — run the full application-level analysis.
    const { applicationId } = job.data as { applicationId: string };
    try {
      await runAnalysisForApplication(applicationId);
    } catch (err) {
      logger.error({ err, applicationId }, 'AI analysis job failed');
      throw err; // bull will retry with backoff
    }
  }
});

const badgeWorker = buildWorker('badge-generation', async (job) => {
  const { businessId, professionalId, badgeHash } = job.data as {
    businessId?: string;
    professionalId?: string;
    badgeHash: string;
  };
  logger.info({ businessId, professionalId, badgeHash }, 'Generating badge');

  if (businessId) {
    const business = await businessRepository.findById(businessId);
    if (!business) return;
    const badge = await generateBadge({
      displayName: business.displayName,
      badgeHash,
      level: business.verificationLevel,
    });
    await prisma.verificationDocument.create({
      data: {
        businessId: business.id,
        type: 'OTHER',
        status: 'APPROVED',
        fileKey: badge.key,
        fileUrl: badge.url,
        mimeType: badge.mimeType,
        fileSize: badge.size,
        originalName: `badge-${badgeHash}.svg`,
        encrypted: false,
      },
    });
    return;
  }

  if (professionalId) {
    const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional) return;
    const badge = await generateBadge({
      displayName: professional.displayName,
      badgeHash,
      level: professional.verificationLevel,
    });
    await prisma.verificationDocument.create({
      data: {
        professionalId: professional.id,
        type: 'OTHER',
        status: 'APPROVED',
        fileKey: badge.key,
        fileUrl: badge.url,
        mimeType: badge.mimeType,
        fileSize: badge.size,
        originalName: `badge-${badgeHash}.svg`,
        encrypted: false,
      },
    });
  }
});

const ratingWorker = buildWorker('rating-recompute', async (job) => {
  const data = job.data as { businessId?: string; professionalId?: string };
  if (data.businessId) {
    await businessRepository.recomputeRating(data.businessId);
  } else if (data.professionalId) {
    const agg = await prisma.review.aggregate({
      where: {
        professionalId: data.professionalId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.professional.update({
      where: { id: data.professionalId },
      data: {
        ratingAverage: agg._avg.rating ?? null,
        ratingCount: agg._count._all,
      },
    });
  }
});

const ipnWorker = buildWorker('payment-ipn', async (job) => {
  // Phase 4 — verify the gateway signature/IPN and persist payment updates.
  const { gateway, body } = job.data as {
    gateway: 'AAMARPAY' | 'SSLCOMMERZ';
    body: Record<string, unknown>;
  };
  try {
    const { paymentService } = await import('../services/paymentService');
    const result = await paymentService.processIpn(gateway, body, {});
    logger.info({ paymentId: result.paymentId, status: result.status, gateway }, 'IPN processed');
  } catch (err) {
    logger.error({ err, gateway }, 'IPN worker failed');
    throw err;
  }
});

const moderationWorker = buildWorker('review-moderation', async (job) => {
  const { reviewId } = job.data as { reviewId: string };
  logger.info({ reviewId }, 'Review flagged for moderation');
  await reviewRepository.update(reviewId, { status: 'PENDING_MODERATION' });
});

// Phase 2 — review-side notifications + Phase 3 verification notifications.
// Both queues reuse the same BullMQ `notifications` slot; we dispatch on job name.
const reviewNotificationWorker = buildWorker('notifications', async (job) => {
  if (job.name === 'review-responded') {
    const { reviewId, responseContent } = job.data as {
      reviewId: string;
      responseContent: string;
    };
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { email: true, firstName: true } },
        business: { select: { displayName: true, slug: true } },
      },
    });
    if (!review?.user.email) return;
    const reviewLink = `${process.env.WEB_URL ?? 'http://localhost:3000'}/business/${review.business.slug}#review-${review.id}`;
    await sendMail({
      to: review.user.email,
      subject: `${review.business.displayName} responded to your review`,
      html: renderTemplate('reviewRespondedByBusiness', {
        businessName: review.business.displayName,
        responseContent,
        reviewLink,
      }).html,
    });
  } else if (job.name === 'review-submitted-thanks') {
    const { reviewId } = job.data as { reviewId: string };
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { email: true, firstName: true } },
        business: { select: { displayName: true } },
      },
    });
    if (!review?.user.email) return;
    const editLink = `${process.env.WEB_URL ?? 'http://localhost:3000'}/account/reviews`;
    await sendMail({
      to: review.user.email,
      subject: 'Thanks for your review on Credible',
      html: renderTemplate('reviewSubmittedThanks', {
        firstName: review.user.firstName,
        businessName: review.business.displayName,
        editLink,
      }).html,
    });
  } else if (job.name === 'verification-status-changed') {
    // Phase 3 — applicant receives an email when status changes.
    const { applicationId, status } = job.data as {
      applicationId: string;
      status: 'SUBMITTED' | 'HUMAN_REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED';
    };
    const app = await prisma.verificationApplication.findUnique({
      where: { id: applicationId },
      include: { business: { include: { owner: { select: { email: true, firstName: true } } } } },
    });
    if (!app?.business.owner.email) return;
    const dashboardLink = `${process.env.WEB_URL ?? 'http://localhost:3000'}/business/verification`;
    const template = status === 'APPROVED'
      ? 'verificationApprovedWithBadge'
      : status === 'REJECTED'
        ? 'verificationRejectedWithReason'
        : 'verificationStatusUpdate';
    await sendMail({
      to: app.business.owner.email,
      subject: status === 'APPROVED'
        ? `Congratulations — ${app.business.displayName} is now verified`
        : status === 'REJECTED'
          ? `Update on your verification application`
          : `Your verification application is being reviewed`,
      html: renderTemplate(template, {
        firstName: app.business.owner.firstName,
        businessName: app.business.displayName,
        applicationId: app.id,
        status,
        reason: app.rejectionReason,
        level: app.level,
        dashboardLink,
      }).html,
    });
  }
});

async function shutdown(): Promise<void> {
  logger.info('Stopping workers...');
  await Promise.all([
    emailWorker.close(),
    aiWorker.close(),
    badgeWorker.close(),
    ratingWorker.close(),
    ipnWorker.close(),
    moderationWorker.close(),
    reviewNotificationWorker.close(),
  ]);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

logger.info('🛠️  Credible workers started');
