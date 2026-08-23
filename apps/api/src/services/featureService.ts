/**
 * Feature gating service.
 *
 * The `FEATURE_MATRIX` is the single source of truth for what each subscription
 * plan can do. Use `checkFeature(feature)` as middleware to enforce limits and
 * use `getFeaturesFor(plan)` from controllers / web to render upgrade hints.
 */

import type { NextFunction, Request, Response } from 'express';
import type { PlanFeature, SubscriptionPlan } from '@credible/types';
import { prisma } from '../lib/db/prisma';
import { ForbiddenError } from '../lib/errors/AppError';
import { logger } from '../lib/logger/logger';

export const FEATURE_MATRIX: Record<SubscriptionPlan, PlanFeature> = {
  FREE: {
    canList: true,
    canCollectReviews: true,
    canRespondReviews: true,
    canGetVerified: false,
    canUseWidgets: false,
    canGenerateQR: false,
    canSendInvitations: false,
    reviewWidget: false,
    trustScoreWidget: false,
    customDomain: false,
    badgeDisplay: false,
    analytics: false,
    reviewInvitationsLimit: 0,
    documentUploadLimit: 0,
    supportLevel: 'EMAIL',
  },
  BASIC: {
    canList: true,
    canCollectReviews: true,
    canRespondReviews: true,
    canGetVerified: true,
    canUseWidgets: true,
    canGenerateQR: true,
    canSendInvitations: true,
    reviewWidget: true,
    trustScoreWidget: true,
    customDomain: false,
    badgeDisplay: true,
    analytics: true,
    reviewInvitationsLimit: 100,
    documentUploadLimit: 10,
    supportLevel: 'PRIORITY_EMAIL',
  },
  PROFESSIONAL: {
    canList: true,
    canCollectReviews: true,
    canRespondReviews: true,
    canGetVerified: true,
    canUseWidgets: true,
    canGenerateQR: true,
    canSendInvitations: true,
    reviewWidget: true,
    trustScoreWidget: true,
    customDomain: true,
    badgeDisplay: true,
    analytics: true,
    reviewInvitationsLimit: 500,
    documentUploadLimit: 20,
    supportLevel: 'PHONE_AND_EMAIL',
  },
  ENTERPRISE: {
    canList: true,
    canCollectReviews: true,
    canRespondReviews: true,
    canGetVerified: true,
    canUseWidgets: true,
    canGenerateQR: true,
    canSendInvitations: true,
    reviewWidget: true,
    trustScoreWidget: true,
    customDomain: true,
    badgeDisplay: true,
    analytics: true,
    reviewInvitationsLimit: Number.MAX_SAFE_INTEGER,
    documentUploadLimit: 100,
    supportLevel: 'PHONE_AND_EMAIL',
  },
};

export function getFeaturesFor(plan: SubscriptionPlan): PlanFeature {
  return FEATURE_MATRIX[plan] ?? FEATURE_MATRIX.FREE;
}

/**
 * Returns the business owner's active plan. Free users (no subscription record
 * or a cancelled subscription) are treated as `FREE`.
 */
export async function getActivePlanForBusiness(businessId: string): Promise<SubscriptionPlan> {
  const sub = await prisma.subscription.findFirst({
    where: {
      businessId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { plan: true },
  });
  return (sub?.plan as SubscriptionPlan | undefined) ?? 'FREE';
}

/**
 * Returns the full subscription row (latest, regardless of status) so callers
 * can check the `SubscriptionUsage` counters.
 */
export async function getSubscriptionForBusiness(businessId: string) {
  return prisma.subscription.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}

export type GateableFeature =
  | keyof Omit<PlanFeature, 'reviewInvitationsLimit' | 'documentUploadLimit' | 'supportLevel'>
  | 'reviewInvitations'
  | 'documentUploads';

export interface FeatureGateDeps {
  /**
   * Optional override of the plan resolver — useful in tests.
   */
  resolvePlan?: (businessId: string) => Promise<SubscriptionPlan>;
}

/**
 * Middleware factory that returns a 403 with an `upgradeUrl` payload when the
 * current business's plan does not include the requested feature.
 *
 * Special features handled beyond the boolean matrix:
 *   - `reviewInvitations`: enforces the monthly `reviewInvitationsLimit`.
 *   - `documentUploads`:   enforces the per-account `documentUploadLimit`.
 */
export function checkFeature(feature: GateableFeature, deps: FeatureGateDeps = {}) {
  const resolve = deps.resolvePlan ?? getActivePlanForBusiness;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) return next(new ForbiddenError('Authentication required'));

      // Admins bypass feature gating — they manage plans, not consume them.
      if (user.role === 'ADMIN') return next();

      // Resolve the business owned by this user.
      const business = await prisma.business.findUnique({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (!business) return next(new ForbiddenError('Business context required'));
      const businessId = business.id;

      const plan = await resolve(businessId);
      const features = getFeaturesFor(plan);

      if (feature === 'reviewInvitations') {
        if (!features.canSendInvitations) {
          return next(
            new ForbiddenError('Inviting reviewers is not available on your current plan'),
          );
        }
        if (features.reviewInvitationsLimit !== Number.MAX_SAFE_INTEGER) {
          const usage = await usageThisMonth(businessId);
          if (usage.reviewInvitations >= features.reviewInvitationsLimit) {
            return next(
              new ForbiddenError('You have reached your monthly review-invitation limit'),
            );
          }
        }
        return next();
      }

      if (feature === 'documentUploads') {
        if (features.documentUploadLimit === 0) {
          return next(new ForbiddenError('Document uploads are not available on your plan'));
        }
        return next();
      }

      const value = (features as PlanFeature)[feature];
      if (!value) {
        return next(new ForbiddenError('Feature not available on your current plan'));
      }
      next();
    } catch (err) {
      logger.error({ err, feature }, 'Feature gate check failed');
      next(err);
    }
  };
}

async function usageThisMonth(businessId: string): Promise<{ reviewInvitations: number }> {
  const sub = await getSubscriptionForBusiness(businessId);
  if (!sub) return { reviewInvitations: 0 };
  const month = new Date().toISOString().slice(0, 7);
  const usage = await prisma.subscriptionUsage.findUnique({
    where: { subscriptionId_month: { subscriptionId: sub.id, month } },
    select: { reviewInvitations: true },
  });
  return { reviewInvitations: usage?.reviewInvitations ?? 0 };
}

/**
 * 403 body shape that the web app can read to render an upsell card.
 */
export interface UpgradeRequiredBody {
  success: false;
  error: {
    code: 'FEATURE_NOT_AVAILABLE' | 'USAGE_LIMIT_REACHED';
    message: string;
    upgradeUrl: string;
    currentPlan: SubscriptionPlan;
    requiredPlan: SubscriptionPlan;
  };
}

export function upgradeRequiredResponse(args: {
  message: string;
  currentPlan: SubscriptionPlan;
  requiredPlan: SubscriptionPlan;
  code?: 'FEATURE_NOT_AVAILABLE' | 'USAGE_LIMIT_REACHED';
}): UpgradeRequiredBody {
  return {
    success: false,
    error: {
      code: args.code ?? 'FEATURE_NOT_AVAILABLE',
      message: args.message,
      upgradeUrl: '/business/subscription/plans',
      currentPlan: args.currentPlan,
      requiredPlan: args.requiredPlan,
    },
  };
}

export const featureService = {
  FEATURE_MATRIX,
  getFeaturesFor,
  getActivePlanForBusiness,
  getSubscriptionForBusiness,
  checkFeature,
};
export default featureService;