/**
 * GDPR-style data subject requests. Authenticated users submit a request
 * from `/privacy`; admins triage them out-of-band (the admin list view
 * is a separate endpoint not implemented in this PR).
 *
 * Auth is required — the controller binds the request to `req.user.id`.
 */
import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { dataRequestSchema } from '@credible/shared';
import { prisma } from '../../lib/db/prisma';
import { authRequired } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authRequired,
  validate(dataRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.dataRequest.create({
        data: {
          userId: req.user!.id,
          type: req.body.type,
          notes: req.body.notes,
        },
        select: { id: true, createdAt: true },
      });
      res.status(201).json({ success: true, data: record });
    } catch (e) {
      next(e);
    }
  },
);

export { router as dataRequestsRouter };
export default router;
