/**
 * Users module — endpoints for the authenticated user's own profile.
 *
 *   GET    /users/me      — current user's public-safe profile
 *   PATCH  /users/me      — update first/last name
 *
 * Email change is intentionally NOT exposed here; that's a separate
 * OTP-verification flow that lives outside this module.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authRequired, ensureActiveUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../lib/db/prisma';
import { NotFoundError } from '../../lib/errors/AppError';

const updateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    avatar: z.string().trim().url().max(2048).optional(),
  })
  .strict()
  .refine(
    (v) => v.firstName !== undefined || v.lastName !== undefined || v.avatar !== undefined,
    { message: 'Provide at least one of firstName, lastName, or avatar.' },
  );

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export const userRouter = Router();

userRouter.get('/me', authRequired, ensureActiveUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundError('User');
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

userRouter.patch(
  '/me',
  authRequired,
  ensureActiveUser,
  validate(updateMeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: req.body,
        select: SAFE_USER_SELECT,
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

export default userRouter;
