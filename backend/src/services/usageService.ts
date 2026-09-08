/**
 * Usage tracking — increments per-month counters that back the feature limits
 * defined in `featureService.FEATURE_MATRIX`.
 *
 * Usage rows live on the *subscription* (not the business) so when a
 * business cancels and re-subscribes the counters start fresh.
 */

import { prisma } from '../lib/db/prisma';
import { featureService, FEATURE_MATRIX } from './featureService';
import { queues } from '../lib/queue/queues';
import { NotFoundError } from '../lib/errors/AppError';

export type Counter =
  | 'reviewInvitations'
  | 'reviewResponses'
  | 'documentUploads'
  | 'apiCalls'
  | 'websiteViews';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

async function findActiveSubscription(businessId: string) {
  const sub = await prisma.subscription.findFirst({
    where: {
      businessId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!sub) throw new NotFoundError('Active subscription');
  return sub;
}

export const usageService = {
  /**
   * Increment a counter and return the new value. Returns null when the
   * business has no active subscription (the caller decides whether to treat
   * that as an error or silently skip).
   */
  async increment(
    businessId: string,
    counter: Counter,
    by = 1,
  ): Promise<number | null> {
    const sub = await prisma.subscription.findFirst({
      where: {
        businessId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!sub) return null;

    const month = currentMonth();
    const updated = await prisma.subscriptionUsage.upsert({
      where: { subscriptionId_month: { subscriptionId: sub.id, month } },
      update: { [counter]: { increment: by } },
      create: { subscriptionId: sub.id, month, [counter]: by },
    });
    return updated[counter];
  },

  async getMonthlyUsage(businessId: string): Promise<{
    month: string;
    reviewInvitations: number;
    reviewResponses: number;
    documentUploads: number;
    apiCalls: number;
    websiteViews: number;
    limit: number;
  }> {
    const sub = await findActiveSubscription(businessId);
    const month = currentMonth();
    const usage = await prisma.subscriptionUsage.findUnique({
      where: { subscriptionId_month: { subscriptionId: sub.id, month } },
    });
    const features = FEATURE_MATRIX[sub.plan];
    return {
      month,
      reviewInvitations: usage?.reviewInvitations ?? 0,
      reviewResponses: usage?.reviewResponses ?? 0,
      documentUploads: usage?.documentUploads ?? 0,
      apiCalls: usage?.apiCalls ?? 0,
      websiteViews: usage?.websiteViews ?? 0,
      limit: features.reviewInvitationsLimit,
    };
  },

  /**
   * Convenience: increment the review-invitation counter, then schedule a
   * notification email if the business has hit ≥ 80% of its plan limit.
   */
  async trackInvitation(businessId: string): Promise<number | null> {
    const newValue = await this.increment(businessId, 'reviewInvitations');
    if (newValue === null) return null;

    const sub = await findActiveSubscription(businessId);
    const limit = FEATURE_MATRIX[sub.plan].reviewInvitationsLimit;
    if (
      Number.isFinite(limit) &&
      newValue >= limit * 0.8 &&
      newValue - 1 < limit * 0.8 // only fire on the crossing event
    ) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { owner: { select: { email: true, firstName: true } } },
      });
      if (business?.owner.email) {
        await queues['send-email'].add('usage-warning', {
          template: 'subscriptionExpiringSoon',
          to: business.owner.email,
          vars: {
            type: 'USAGE_WARNING',
            firstName: business.owner.firstName,
            businessName: business.displayName,
            metric: 'reviewInvitations',
            used: newValue,
            limit,
            upgradeUrl: '/business/subscription/plans',
          },
        });
      }
    }
    return newValue;
  },
};

export default usageService;
// keep featureService referenced to avoid tree-shake warnings in test runners.
export const _resolvePlanRef = featureService.getActivePlanForBusiness;