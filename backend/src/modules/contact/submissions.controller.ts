/**
 * Public `/contact/submissions` endpoint — the general contact form on
 * `/contact` writes here. Per-business inquiries still flow through the
 * existing `contact.controller.ts` route.
 *
 * Defense layers:
 *   1. Honeypot field `website` — must be empty (Zod schema enforces).
 *   2. `contactSubmissionRateLimit` — 5 / hour / IP (mounted on the route).
 *   3. Append-only audit row — no PII echoed back to the client.
 */
import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { contactSubmissionSchema } from '@credible/shared';
import { prisma } from '../../lib/db/prisma';
import { validate } from '../../middleware/validate';
import { contactSubmissionRateLimit } from '../../middleware/rateLimit';

const router = Router({ mergeParams: true });

router.post(
  '/submissions',
  contactSubmissionRateLimit,
  validate(contactSubmissionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress =
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
        req.ip ??
        null;
      const userAgent = req.headers['user-agent'] ?? null;
      await prisma.contactSubmission.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          subject: req.body.subject,
          message: req.body.message,
          ipAddress,
          userAgent,
        },
      });
      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

export { router as contactSubmissionsRouter };
export default router;
