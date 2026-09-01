/**
 * Subscription + billing routes (owner-facing).
 *
 *   GET    /business/subscription
 *   GET    /business/subscription/plans
 *   POST   /business/subscription/subscribe
 *   POST   /business/subscription/cancel
 *   POST   /business/subscription/reactivate
 *   GET    /business/subscription/invoices
 *   GET    /business/subscription/invoices/:invoiceId
 *   GET    /business/subscription/invoices/:invoiceId/download
 *   GET    /business/subscription/payment-history
 *   POST   /business/subscription/voucher/validate
 */

import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import {
  cancelSubscriptionSchema,
  subscribePlanSchema,
  validateVoucherSchema,
} from '@credible/shared';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { subscriptionsController } from './subscriptions.controller';

const router = Router();

router.use(authRequired, ensureActiveUser, requireRole('BUSINESS'));

router.get('/', subscriptionsController.getCurrent);
router.get('/plans', subscriptionsController.listPlans);
router.post('/subscribe', validate(subscribePlanSchema), subscriptionsController.subscribe);
router.post('/cancel', validate(cancelSubscriptionSchema), subscriptionsController.cancel);
router.post('/reactivate', subscriptionsController.reactivate);

router.get('/invoices', subscriptionsController.listInvoices);
router.get('/invoices/:invoiceId', subscriptionsController.getInvoice);
router.get('/invoices/:invoiceId/download', subscriptionsController.downloadInvoice);

router.get('/payment-history', subscriptionsController.paymentHistory);
router.post('/voucher/validate', validate(validateVoucherSchema), subscriptionsController.validateVoucher);

// Catch-all so unknown sub-routes return a 404 rather than rendering HTML.
router.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `No subscription route for ${req.path}` },
  });
});

export { router as subscriptionRouter };
export default router;
