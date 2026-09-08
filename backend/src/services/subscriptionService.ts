/**
 * Subscription service — owner-facing reads and lifecycle operations.
 */

import { prisma } from '../lib/db/prisma';
import { env } from '../config/env';
import { queues } from '../lib/queue/queues';
import { BadRequestError, NotFoundError } from '../lib/errors/AppError';
import { featureService, FEATURE_MATRIX } from './featureService';
import { usageService } from './usageService';
import type { SubscriptionPlan } from '@credible/types';

export interface CurrentSubscriptionView {
  plan: SubscriptionPlan;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingCycle: string | null;
  nextPaymentDate: string | null;
  autoRenew: boolean;
  amount: number | null;
  currency: string;
  cancelAtPeriodEnd: boolean;
  features: ReturnType<typeof featureService.getFeaturesFor>;
  usage: Awaited<ReturnType<typeof usageService.getMonthlyUsage>>;
}

export const subscriptionService = {
  async getCurrentForBusiness(businessId: string): Promise<CurrentSubscriptionView> {
    const sub = await prisma.subscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    const plan: SubscriptionPlan = (sub?.plan as SubscriptionPlan | undefined) ?? 'FREE';
    const features = featureService.getFeaturesFor(plan);
    const usage = await usageService.getMonthlyUsage(businessId).catch(() => ({
      month: new Date().toISOString().slice(0, 7),
      reviewInvitations: 0,
      reviewResponses: 0,
      documentUploads: 0,
      apiCalls: 0,
      websiteViews: 0,
      limit: features.reviewInvitationsLimit,
    }));

    return {
      plan,
      status: sub?.status ?? 'INACTIVE',
      currentPeriodStart: (sub?.currentPeriodStart ?? new Date()).toISOString(),
      currentPeriodEnd: (sub?.currentPeriodEnd ?? new Date()).toISOString(),
      billingCycle: sub?.billingCycle ?? null,
      nextPaymentDate: sub?.nextPaymentDate?.toISOString() ?? null,
      autoRenew: sub?.autoRenew ?? false,
      amount: sub?.amount !== undefined && sub?.amount !== null ? Number(sub.amount) : null,
      currency: 'BDT',
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      features,
      usage,
    };
  },

  async listPlans(): Promise<
    Array<{
      id: SubscriptionPlan;
      code: SubscriptionPlan;
      name: string;
      description: string;
      priceMonthly: number;
      priceYearly: number;
      currency: string;
      features: ReturnType<typeof featureService.getFeaturesFor>;
      hasVerification: boolean;
      hasBadge: boolean;
    }>
  > {
    const plans = await prisma.subscriptionPlanInfo.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });
    return plans.map((plan) => ({
      id: plan.code as SubscriptionPlan,
      code: plan.code as SubscriptionPlan,
      name: plan.name,
      description: plan.description ?? '',
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      currency: plan.currency,
      features: featureService.getFeaturesFor(plan.code as SubscriptionPlan),
      hasVerification: plan.hasVerification,
      hasBadge: plan.hasBadge,
    }));
  },

  async cancel(args: { businessId: string; immediate: boolean; reason?: string; actorId: string }) {
    const sub = await prisma.subscription.findFirst({
      where: { businessId: args.businessId, status: { in: ['ACTIVE', 'TRIALING'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new NotFoundError('Active subscription');

    if (args.immediate) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: true,
          cancellationReason: args.reason ?? null,
          autoRenew: false,
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          cancelAtPeriodEnd: true,
          cancellationReason: args.reason ?? null,
          autoRenew: false,
        },
      });
    }

    const business = await prisma.business.findUnique({
      where: { id: args.businessId },
      include: { owner: { select: { email: true, firstName: true } } },
    });
    if (business?.owner.email) {
      await queues['send-email'].add('subscription-cancelled', {
        template: 'subscriptionCancelled',
        to: business.owner.email,
        vars: {
          firstName: business.owner.firstName,
          businessName: business.displayName,
          plan: String(sub.plan),
          reason: args.reason ?? null,
          reactivateUrl: `${env.WEB_URL}/business/subscription`,
        },
      });
    }
    return subscriptionService.getCurrentForBusiness(args.businessId);
  },

  async reactivate(businessId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new NotFoundError('Subscription');
    if (!sub.cancelAtPeriodEnd && sub.status !== 'CANCELED' && sub.status !== 'PAST_DUE') {
      throw new BadRequestError('Subscription is already active', 'ALREADY_ACTIVE');
    }
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        autoRenew: sub.billingCycle !== 'ONE_TIME',
        canceledAt: null,
      },
    });
    return subscriptionService.getCurrentForBusiness(businessId);
  },
};

export default subscriptionService;
export const _featRef = FEATURE_MATRIX; // keep import alive