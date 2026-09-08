/**
 * Admin-extended routes.
 *
 * Mounted under `/admin/*` alongside the existing admin router — every route
 * inherits the same `authRequired → ensureActiveUser → requireRole('ADMIN')`
 * guard chain so we don't repeat the boilerplate.
 */
import { Router } from 'express';
import {
  adminListUsersSchema,
  adminListBusinessesSchema,
  adminListProfessionalsSchema,
  adminListContactRequestsSchema,
  adminListAuditLogsSchema,
  adminListPaymentsSchema,
  adminListSubscriptionsSchema,
} from '@credible/shared';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { adminExtendedController } from './admin-extended.controller';

const router = Router();

router.use(authRequired, ensureActiveUser, requireRole('ADMIN'));

// Users
router.get('/users', validate(adminListUsersSchema, 'query'), adminExtendedController.listUsers);
router.get('/users/:id', adminExtendedController.getUser);
router.put('/users/:id', adminExtendedController.updateUser);

// Businesses
router.get(
  '/businesses',
  validate(adminListBusinessesSchema, 'query'),
  adminExtendedController.listBusinesses,
);
router.get('/businesses/:id', adminExtendedController.getBusiness);
router.post('/businesses/:id/status', adminExtendedController.setBusinessStatus);

// Professionals
router.get(
  '/professionals',
  validate(adminListProfessionalsSchema, 'query'),
  adminExtendedController.listProfessionals,
);
router.get('/professionals/:id', adminExtendedController.getProfessional);
router.post('/professionals/:id/status', adminExtendedController.setProfessionalStatus);

// Payments
router.get(
  '/billing/payments',
  validate(adminListPaymentsSchema, 'query'),
  adminExtendedController.listPayments,
);
router.get('/billing/payments/:id', adminExtendedController.getPayment);
router.post('/billing/payments/:id/refund', adminExtendedController.refundPayment);

// Subscriptions
router.get(
  '/billing/subscriptions',
  validate(adminListSubscriptionsSchema, 'query'),
  adminExtendedController.listSubscriptions,
);
router.get('/billing/subscriptions/:id', adminExtendedController.getSubscription);
router.post('/billing/subscriptions/:id/cancel', adminExtendedController.cancelSubscription);
router.post(
  '/billing/subscriptions/:id/override',
  adminExtendedController.overrideSubscription,
);

// Contact requests
router.get(
  '/contact-requests',
  validate(adminListContactRequestsSchema, 'query'),
  adminExtendedController.listContactRequests,
);
router.get('/contact-requests/:id', adminExtendedController.getContactRequest);
router.put('/contact-requests/:id', adminExtendedController.updateContactRequest);

// Audit log
router.get(
  '/audit-logs',
  validate(adminListAuditLogsSchema, 'query'),
  adminExtendedController.listAuditLogs,
);

// Settings
router.get('/settings', adminExtendedController.listSettings);
router.put('/settings/:key', adminExtendedController.upsertSetting);

export { router as adminExtendedRouter };
export default router;