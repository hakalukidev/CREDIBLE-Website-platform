/**
 * Payment service — orchestrates gateway I/O, payment rows, subscription
 * transitions and invoice + email side-effects.
 *
 * Idempotency: every payment is keyed by `gatewayTxnId`. When the same IPN is
 * delivered twice the second call is a no-op (returns the existing payment).
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger/logger';
import { queues } from '../lib/queue/queues';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../lib/errors/AppError';
import { getAdapter, type IpnPayload } from '../lib/payments/payment.gateway';
import { voucherService } from './voucherService';
import { invoiceService } from './invoiceService';
import type {
  BillingCycle,
  PaymentGateway,
  SubscriptionPlan,
} from '@credible/types';

export interface InitiateCheckoutInput {
  userId: string;
  businessId: string;
  planId: SubscriptionPlan;
  billingCycle: BillingCycle;
  gateway: PaymentGateway;
  voucherCode?: string;
}

export interface InitiateCheckoutResult {
  subscriptionId: string;
  paymentId: string;
  gateway: PaymentGateway;
  redirectUrl: string;
  amount: number;
  currency: string;
}

function nextPeriodEnd(cycle: BillingCycle, from = new Date()): Date {
  const d = new Date(from);
  switch (cycle) {
    case 'ONE_TIME':
      return d;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'QUARTERLY':
      d.setMonth(d.getMonth() + 3);
      return d;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      return d;
    default:
      return d;
  }
}

export const paymentService = {
  /**
   * Create a pending `Subscription` and `Payment` row, then call the gateway
   * adapter to obtain a redirect URL. Webhooks/IPN/callbacks subsequently
   * promote the payment to `SUCCESS` via `processIpn`.
   */
  async initiateCheckout(input: InitiateCheckoutInput): Promise<InitiateCheckoutResult> {
    const plan = await prisma.subscriptionPlanInfo.findUnique({
      where: { code: input.planId },
    });
    if (!plan) throw new NotFoundError('Plan');
    if (!plan.isActive) throw new BadRequestError('Plan is not available', 'PLAN_INACTIVE');

    const business = await prisma.business.findUnique({ where: { id: input.businessId } });
    if (!business) throw new NotFoundError('Business');

    let amount = Number(
      input.billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly,
    );

    let voucherResult: Awaited<ReturnType<typeof voucherService.validate>> | null = null;
    if (input.voucherCode) {
      voucherResult = await voucherService.validate({
        code: input.voucherCode,
        planId: input.planId,
        amount,
        businessId: input.businessId,
      });
      if (!voucherResult.valid) {
        throw new BadRequestError(voucherResult.message, 'VOUCHER_INVALID');
      }
      amount = voucherResult.discountedPrice;
    }

    const adapter = getAdapter(input.gateway);
    if (!adapter) {
      throw new BadRequestError(`Gateway ${input.gateway} is not configured`, 'GATEWAY_NOT_READY');
    }

    const orderId = `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const successUrl =
      input.gateway === 'SSLCOMMERZ'
        ? env.SSLCZ_SUCCESS_URL ?? `${env.API_URL}/api/v1/payments/sslcommerz/success`
        : env.AAMARPAY_SUCCESS_URL ?? `${env.API_URL}/api/v1/payments/aamarpay/success`;
    const failUrl =
      input.gateway === 'SSLCOMMERZ'
        ? env.SSLCZ_FAIL_URL ?? `${env.API_URL}/api/v1/payments/sslcommerz/fail`
        : env.AAMARPAY_FAIL_URL ?? `${env.API_URL}/api/v1/payments/aamarpay/fail`;
    const cancelUrl =
      input.gateway === 'SSLCOMMERZ'
        ? env.SSLCZ_CANCEL_URL ?? `${env.API_URL}/api/v1/payments/sslcommerz/cancel`
        : env.AAMARPAY_CANCEL_URL ?? `${env.API_URL}/api/v1/payments/aamarpay/cancel`;

    const session = await adapter.createSession({
      gateway: input.gateway,
      amount,
      currency: plan.currency,
      orderId,
      customerName: business.displayName,
      customerEmail: business.email ?? `${business.slug}@credible.example`,
      customerPhone: business.phone ?? undefined,
      successUrl,
      failUrl,
      cancelUrl,
      metadata: {
        subscriptionId: undefined, // filled below after we create the subscription
        businessId: business.id,
        productName: `${plan.name} plan (${input.billingCycle.toLowerCase()})`,
        productCategory: 'Subscription',
      },
    });

    const { subscription, payment } = await prisma.$transaction(async (tx) => {
      // Cancel any active subscription so we don't end up with duplicates.
      await tx.subscription.updateMany({
        where: { businessId: business.id, status: { in: ['ACTIVE', 'TRIALING'] } },
        data: { status: 'CANCELED', canceledAt: new Date() },
      });

      const subscription = await tx.subscription.create({
        data: {
          userId: input.userId,
          businessId: business.id,
          plan: input.planId,
          status: 'TRIALING',
          gateway: input.gateway,
          billingCycle: input.billingCycle,
          amount,
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextPeriodEnd(input.billingCycle),
          autoRenew: input.billingCycle !== 'ONE_TIME',
          nextPaymentDate:
            input.billingCycle === 'ONE_TIME' ? null : nextPeriodEnd(input.billingCycle),
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId: input.userId,
          businessId: business.id,
          subscriptionId: subscription.id,
          gateway: input.gateway,
          amount,
          currency: plan.currency,
          status: 'PENDING',
          paymentMethod: input.gateway === 'SSLCOMMERZ' ? 'SSLCOMMERZ' : 'AAMARPAY',
          gatewayTxnId: orderId,
          ipnPayload: { sessionKey: session.sessionKey } as Prisma.InputJsonValue,
        },
      });
      return { subscription, payment };
    });

    return {
      subscriptionId: subscription.id,
      paymentId: payment.id,
      gateway: input.gateway,
      redirectUrl: session.redirectUrl,
      amount,
      currency: plan.currency,
    };
  },

  /**
   * Mark a payment + subscription as failed (called by gateway fail/cancel
   * callbacks, or by IPN when the gateway reports a failed status).
   */
  async recordFailure(args: {
    gateway: PaymentGateway;
    orderId: string;
    raw: Record<string, unknown>;
    reason?: string;
  }): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { gatewayTxnId: args.orderId, gateway: args.gateway },
    });
    if (!payment) {
      logger.warn({ args }, 'recordFailure: payment not found');
      return;
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        ipnPayload: args.raw as Prisma.InputJsonValue,
        refundReason: args.reason ?? null,
      },
    });

    if (payment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'PAST_DUE' },
      });
    }

    // Notify the business.
    if (payment.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: payment.businessId },
        include: { owner: { select: { email: true, firstName: true } } },
      });
      if (business?.owner.email) {
        await queues['send-email'].add('payment-failed', {
          template: 'paymentFailed',
          to: business.owner.email,
          vars: {
            firstName: business.owner.firstName,
            businessName: business.displayName,
            amount: Number(payment.amount),
            currency: payment.currency,
            updateUrl: `${env.WEB_URL}/business/subscription`,
          },
        });
      }
    }
  },

  /**
   * Verifies the gateway IPN, persists it and — on success — transitions the
   * subscription to `ACTIVE`, generates an invoice and emails the business.
   *
   * Idempotent: re-delivering the same IPN is a no-op.
   */
  async processIpn(
    gateway: PaymentGateway,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ): Promise<{ paymentId: string; status: 'SUCCESS' | 'FAILED' | 'CANCEL' }> {
    const adapter = getAdapter(gateway);
    if (!adapter) {
      throw new BadRequestError(`Gateway ${gateway} is not configured`, 'GATEWAY_NOT_READY');
    }

    const ipn = await adapter.verifyIpn(body, headers).catch((err) => {
      logger.error({ err, gateway }, 'IPN verification failed');
      throw err;
    });

    const existing = await prisma.payment.findFirst({
      where: {
        gatewayTxnId: ipn.orderId,
        gateway,
      },
    });

    if (!existing) {
      logger.warn({ gateway, orderId: ipn.orderId }, 'IPN received for unknown order');
      // Record as an orphan payment for audit but don't crash.
      await prisma.payment.create({
        data: {
          userId: '000000000000000000000000', // placeholder; not linked to a user
          gateway,
          amount: ipn.amount,
          currency: ipn.currency,
          status: ipn.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
          gatewayTxnId: ipn.orderId,
          ipnPayload: ipn.raw as Prisma.InputJsonValue,
          paymentMethod: gateway === 'SSLCOMMERZ' ? 'SSLCOMMERZ' : 'AAMARPAY',
          paidAt: ipn.status === 'SUCCESS' ? new Date() : null,
        },
      }).catch((err) => logger.warn({ err }, 'orphan payment record failed'));
      return { paymentId: 'unknown', status: ipn.status };
    }

    if (existing.status === 'SUCCESS') {
      logger.info({ paymentId: existing.id }, 'IPN replay — already processed');
      return { paymentId: existing.id, status: 'SUCCESS' };
    }

    if (ipn.status !== 'SUCCESS') {
      await prisma.payment.update({
        where: { id: existing.id },
        data: {
          status: ipn.status === 'CANCEL' ? 'CANCELED' : 'FAILED',
          ipnPayload: ipn.raw as Prisma.InputJsonValue,
        },
      });
      if (existing.subscriptionId) {
        await prisma.subscription.update({
          where: { id: existing.subscriptionId },
          data: { status: 'PAST_DUE' },
        });
      }
      return { paymentId: existing.id, status: ipn.status };
    }

    // ---- Success path ----
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: existing.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          gatewayTxnId: ipn.gatewayTxnId ?? ipn.orderId,
          ipnPayload: ipn.raw as Prisma.InputJsonValue,
          paymentMethod: gateway === 'SSLCOMMERZ' ? 'SSLCOMMERZ' : 'AAMARPAY',
        },
      });

      if (!payment.subscriptionId) {
        throw new BadRequestError('Payment is missing subscriptionId', 'INVALID_PAYMENT');
      }
      const subscription = await tx.subscription.findUnique({
        where: { id: payment.subscriptionId },
      });
      if (!subscription) {
        throw new NotFoundError('Subscription');
      }

      const now = new Date();
      const nextEnd = nextPeriodEnd((subscription.billingCycle ?? 'MONTHLY') as BillingCycle, now);

      const updatedSub = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          lastPaymentDate: now,
          nextPaymentDate: subscription.billingCycle === 'ONE_TIME' ? null : nextEnd,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: nextEnd,
        },
      });

      const invoice = await invoiceService.createForPayment(tx, {
        subscriptionId: updatedSub.id,
        businessId: subscription.businessId!,
        amount: Number(payment.amount),
        plan: String(updatedSub.plan),
        billingCycle: String(updatedSub.billingCycle ?? 'ONE_TIME'),
      });

      return { payment, subscription: updatedSub, invoice };
    });

    // Best-effort side-effects after the transaction.
    invoiceService
      .uploadToStorage(result.invoice.id)
      .catch((err) => logger.error({ err, invoiceId: result.invoice.id }, 'Invoice upload failed'));

    if (result.subscription.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: result.subscription.businessId },
        include: { owner: { select: { email: true, firstName: true } } },
      });
      if (business?.owner.email) {
        await queues['send-email'].add('payment-confirmed', {
          template: 'paymentConfirmation',
          to: business.owner.email,
          vars: {
            firstName: business.owner.firstName,
            businessName: business.displayName,
            plan: String(result.subscription.plan),
            billingCycle: String(result.subscription.billingCycle ?? 'ONE_TIME'),
            amount: Number(result.payment.amount),
            currency: result.payment.currency,
            endDate: result.subscription.currentPeriodEnd.toLocaleDateString('en-GB'),
            invoiceNumber: result.invoice.invoiceNumber,
            dashboardUrl: `${env.WEB_URL}/business/subscription`,
          },
        });
      }
    }

    return { paymentId: result.payment.id, status: 'SUCCESS' };
  },

  /**
   * Manually mark a subscription as paid (admin / test path). Mirrors the
   * IPN success path but uses `gateway: MANUAL` and skips adapter calls.
   */
  async recordManualPayment(args: {
    subscriptionId: string;
    amount: number;
    note?: string;
    actorId?: string;
  }): Promise<void> {
    const sub = await prisma.subscription.findUnique({ where: { id: args.subscriptionId } });
    if (!sub) throw new NotFoundError('Subscription');
    if (!sub.businessId) throw new BadRequestError('Subscription is missing businessId');

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          userId: sub.userId,
          businessId: sub.businessId,
          subscriptionId: sub.id,
          gateway: 'MANUAL',
          amount: args.amount,
          currency: 'BDT',
          status: 'SUCCESS',
          paymentMethod: 'BANK_TRANSFER',
          paidAt: new Date(),
          gatewayTxnId: `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          lastPaymentDate: new Date(),
          nextPaymentDate:
            sub.billingCycle === 'ONE_TIME' ? null : nextPeriodEnd(sub.billingCycle as BillingCycle),
        },
      });
      await invoiceService.createForPayment(tx, {
        subscriptionId: sub.id,
        businessId: sub.businessId!,
        amount: args.amount,
        plan: String(sub.plan),
        billingCycle: String(sub.billingCycle ?? 'ONE_TIME'),
      });
    });
  },
};

export default paymentService;

// Re-export to avoid lint warnings in callers that import types.
export type { IpnPayload };
export { ConflictError };