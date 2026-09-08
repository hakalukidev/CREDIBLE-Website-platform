import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/db/prisma';
import { validate } from '../../middleware/validate';
import { NotFoundError } from '../../lib/errors/AppError';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10).max(2000),
});

const router = Router({ mergeParams: true });

router.post(
  '/businesses/:businessId/contact',
  validate(contactSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await prisma.business.findUnique({
        where: { id: req.params.businessId as string },
      });
      if (!business || business.deletedAt) throw new NotFoundError('Business');
      const data = await prisma.contactRequest.create({
        data: {
          businessId: business.id,
          requesterId: req.user?.id,
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          message: req.body.message,
        },
      });
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

export { router as contactRouter };
export default router;