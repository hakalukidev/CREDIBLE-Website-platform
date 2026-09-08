/**
 * Payments controller — gateway-facing callbacks and the checkout endpoint.
 *
 * The plan- and voucher-aware checkout lives in `subscriptions.controller`.
 * This file is dedicated to:
 *   - Gateway success / fail / cancel redirects (302 to the web app).
 *   - Gateway IPN endpoints (200 OK after enqueueing the IPN job).
 */

import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { queues } from '../../lib/queue/queues';
import { env } from '../../config/env';
import { logger } from '../../lib/logger/logger';
import { paymentService } from '../../services/paymentService';
import type { PaymentGateway } from '@credible/types';

function webRedirect(path: string): string {
  return `${env.WEB_URL}${path}`;
}

function gatewaySuccessRedirect(gateway: PaymentGateway, tranId: string): string {
  return webRedirect(`/business/subscription/success?gateway=${gateway.toLowerCase()}&tran_id=${tranId}`);
}

function gatewayFailRedirect(gateway: PaymentGateway, tranId: string, reason?: string): string {
  const params = new URLSearchParams({ gateway: gateway.toLowerCase(), tran_id: tranId });
  if (reason) params.set('reason', reason);
  return webRedirect(`/business/subscription/failed?${params.toString()}`);
}

const router = Router();

// ----- IPN endpoints (must respond quickly) -----
router.post('/ipn/aamarpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await queues['process-payment-ipn'].add('aamarpay-ipn', {
      gateway: 'AAMARPAY' as PaymentGateway,
      body: req.body,
    });
    res.json({ success: true });
  } catch (e) {
    logger.error({ err: e }, 'aamarPay IPN enqueue failed');
    next(e);
  }
});

router.post('/ipn/sslcommerz', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await queues['process-payment-ipn'].add('sslcommerz-ipn', {
      gateway: 'SSLCOMMERZ' as PaymentGateway,
      body: req.body,
    });
    res.json({ success: true });
  } catch (e) {
    logger.error({ err: e }, 'SSLCommerz IPN enqueue failed');
    next(e);
  }
});

// ----- Gateway success redirects -----
router.get('/aamarpay/success', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tranId = String(req.query.tran_id ?? '');
    if (tranId) {
      // Process inline (redirect is the success path; user is waiting).
      try {
        await paymentService.processIpn('AAMARPAY', req.query as Record<string, unknown>);
      } catch (err) {
        logger.warn({ err, tranId }, 'inline IPN processing failed for aamarPay success');
      }
    }
    res.redirect(gatewaySuccessRedirect('AAMARPAY', tranId));
  } catch (e) {
    next(e);
  }
});

router.post('/aamarpay/success', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tranId = String(req.body.tran_id ?? '');
    if (tranId) {
      try {
        await paymentService.processIpn('AAMARPAY', req.body as Record<string, unknown>);
      } catch (err) {
        logger.warn({ err, tranId }, 'inline IPN processing failed for aamarPay success POST');
      }
    }
    res.redirect(gatewaySuccessRedirect('AAMARPAY', tranId));
  } catch (e) {
    next(e);
  }
});

router.get('/sslcommerz/success', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tranId = String(req.query.tran_id ?? '');
    if (tranId) {
      try {
        await paymentService.processIpn('SSLCOMMERZ', req.query as Record<string, unknown>);
      } catch (err) {
        logger.warn({ err, tranId }, 'inline IPN processing failed for SSLCommerz success');
      }
    }
    res.redirect(gatewaySuccessRedirect('SSLCOMMERZ', tranId));
  } catch (e) {
    next(e);
  }
});

router.post('/sslcommerz/success', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tranId = String(req.body.tran_id ?? '');
    if (tranId) {
      try {
        await paymentService.processIpn('SSLCOMMERZ', req.body as Record<string, unknown>);
      } catch (err) {
        logger.warn({ err, tranId }, 'inline IPN processing failed for SSLCommerz success POST');
      }
    }
    res.redirect(gatewaySuccessRedirect('SSLCOMMERZ', tranId));
  } catch (e) {
    next(e);
  }
});

// ----- Gateway fail / cancel redirects -----
router.post('/aamarpay/fail', async (req: Request, res: Response, _next: NextFunction) => {
  const tranId = String(req.body.tran_id ?? '');
  paymentService
    .recordFailure({
      gateway: 'AAMARPAY',
      orderId: tranId,
      raw: req.body as Record<string, unknown>,
    })
    .catch((err) => logger.warn({ err }, 'aamarPay fail record failed'));
  res.redirect(gatewayFailRedirect('AAMARPAY', tranId, 'Payment failed'));
});

router.post('/aamarpay/cancel', async (req: Request, res: Response, _next: NextFunction) => {
  const tranId = String(req.body.tran_id ?? '');
  paymentService
    .recordFailure({
      gateway: 'AAMARPAY',
      orderId: tranId,
      raw: req.body as Record<string, unknown>,
      reason: 'Cancelled by user',
    })
    .catch((err) => logger.warn({ err }, 'aamarPay cancel record failed'));
  res.redirect(gatewayFailRedirect('AAMARPAY', tranId, 'Cancelled'));
});

router.post('/sslcommerz/fail', async (req: Request, res: Response, _next: NextFunction) => {
  const tranId = String(req.body.tran_id ?? '');
  paymentService
    .recordFailure({
      gateway: 'SSLCOMMERZ',
      orderId: tranId,
      raw: req.body as Record<string, unknown>,
    })
    .catch((err) => logger.warn({ err }, 'SSLCommerz fail record failed'));
  res.redirect(gatewayFailRedirect('SSLCOMMERZ', tranId, 'Payment failed'));
});

router.post('/sslcommerz/cancel', async (req: Request, res: Response, _next: NextFunction) => {
  const tranId = String(req.body.tran_id ?? '');
  paymentService
    .recordFailure({
      gateway: 'SSLCOMMERZ',
      orderId: tranId,
      raw: req.body as Record<string, unknown>,
      reason: 'Cancelled by user',
    })
    .catch((err) => logger.warn({ err }, 'SSLCommerz cancel record failed'));
  res.redirect(gatewayFailRedirect('SSLCOMMERZ', tranId, 'Cancelled'));
});

// ----- Authenticated admin read endpoints -----
// Note: admin payment listing lives under `/admin/billing/payments` (mounted
// via `billingRouter`). This router stays focused on the gateway callbacks.

export { router as paymentRouter };
export default router;