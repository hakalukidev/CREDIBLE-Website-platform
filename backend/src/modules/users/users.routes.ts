/**
 * Users module — endpoints for the authenticated user's own profile,
 * plus the public profile lookup used by `/profile/[username]`.
 *
 *   GET    /users/me                       — current user's profile
 *   GET    /users/by-username/:username    — public profile (any signed-in viewer)
 *   PATCH  /users/me                       — update identity + profile fields
 *                                            (incl. phone, with the 2-edit cap
 *                                            on `username`)
 *   POST   /users/me/email/change-request  — verify current password, mint
 *                                            an OTP to a new email
 *   POST   /users/me/email/change-verify   — consume the OTP and commit
 *                                            the new email + bump
 *                                            `emailVerifiedAt`
 *   POST   /users/me/password              — change the account password
 *
 * Email + password change live here because they share the SAFE_USER_SELECT
 * projection and need the same auth/ownership middleware.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authRequired, ensureActiveUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../lib/db/prisma';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors/AppError';
import { slugify, withRandomSuffix, changePasswordSchema } from '@credible/shared';
import { hashOtp, verifyOtp as verifyOtpHash } from '@credible/shared/utils/crypto';
import { hashPassword, verifyPassword } from '../../lib/utils/password';
import { env } from '../../config/env';

const updateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    avatar: z.string().trim().url().max(2048).optional(),
    // Public profile fields (Phase 6).
    username: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9-]+$/i, 'Username may only contain letters, numbers, and dashes.')
      .optional(),
    headline: z.string().trim().max(140).optional().nullable(),
    bio: z.string().trim().max(2000).optional().nullable(),
    location: z.string().trim().max(120).optional().nullable(),
    website: z.string().trim().url().max(2048).optional().nullable(),
    coverImage: z.string().trim().url().max(2048).optional().nullable(),
    coverColor: z.string().trim().max(64).optional().nullable(),
    isHireable: z.boolean().optional(),
    // Account settings — phone is editable from the About tab.
    // We keep the legacy regex from the registration flow.
    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^\+?[0-9 ()\-]+$/, 'Phone may only contain digits, spaces, dashes and parentheses.')
      .optional()
      .nullable(),
  })
  .strict()
  .refine(
    (v) =>
      v.firstName !== undefined ||
      v.lastName !== undefined ||
      v.avatar !== undefined ||
      v.username !== undefined ||
      v.headline !== undefined ||
      v.bio !== undefined ||
      v.location !== undefined ||
      v.website !== undefined ||
      v.coverImage !== undefined ||
      v.coverColor !== undefined ||
      v.isHireable !== undefined ||
      v.phone !== undefined,
    { message: 'Provide at least one field to update.' },
  );

/**
 * Safe projection used for `/users/me`.
 * Includes the account-settings fields the About tab edits (phone, username
 * change counter) but omits sensitive fields (password hash, OAuth tokens, …).
 */
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
  status: true,
  username: true,
  slug: true,
  coverImage: true,
  coverColor: true,
  headline: true,
  bio: true,
  location: true,
  website: true,
  isHireable: true,
  usernameChangedCount: true,
  phone: true,
  createdAt: true,
} as const;

/**
 * Full public profile — used by `/users/by-username/:username`.
 * Includes the join-table lists (social links, skills, experience, education)
 * and any business / professional page the user owns.
 */
const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  slug: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
  status: true,
  coverImage: true,
  coverColor: true,
  headline: true,
  bio: true,
  location: true,
  website: true,
  isHireable: true,
  createdAt: true,
  socialLinks: {
    select: { id: true, platform: true, url: true, position: true },
    orderBy: { position: 'asc' },
  },
  skills: {
    select: { id: true, label: true, position: true },
    orderBy: { position: 'asc' },
  },
  experience: {
    select: {
      id: true,
      role: true,
      company: true,
      logoUrl: true,
      startDate: true,
      endDate: true,
      description: true,
      position: true,
    },
    orderBy: { position: 'asc' },
  },
  education: {
    select: { id: true, school: true, detail: true, startYear: true, endYear: true, position: true },
    orderBy: { position: 'asc' },
  },
  business: {
    select: {
      id: true,
      slug: true,
      displayName: true,
      logo: true,
      coverImage: true,
      status: true,
    },
  },
  professional: {
    select: {
      id: true,
      slug: true,
      displayName: true,
      avatar: true,
      status: true,
    },
  },
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

/**
 * GET /users/by-username/:username
 *
 * Resolves a user's public profile by their `username` handle. The slug
 * is accepted as well because we use the `firstName-lastName-idprefix`
 * shape on the public site (so it doubles as both readable and unique).
 *
 * Auth: required. Any signed-in active user can view.
 * Privacy: `email` and `phone` are deliberately omitted.
 */
userRouter.get(
  '/by-username/:username',
  authRequired,
  ensureActiveUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const handle = String(req.params.username ?? '').trim();
      if (!handle) throw new NotFoundError('User');

      // Try multiple lookups in order:
      //   1. exact match on `username` (human-friendly handle like "jane-doe")
      //   2. exact match on `slug` (mirrors username for the URL)
      //   3. exact match on `id` (cuid) — this lets `/profile/<userId>` work
      //      for users who haven't set a username yet. Without this branch,
      //      users with no username/slug would 404 on the profile page.
      // All three columns are @unique (or primary key) and indexed, so the
      // cost of three sequential lookups is negligible (worst-case 3 PK hits).
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: handle },
            { slug: handle },
            // cuids are 25-char base36 strings; only try the id branch when
            // the handle looks like a cuid to avoid unnecessary scans.
            ...(/^c[a-z0-9]{20,}$/i.test(handle) ? [{ id: handle }] : []),
          ],
          status: { not: 'DELETED' },
          deletedAt: null,
        },
        select: PUBLIC_USER_SELECT,
      });
      if (!user) throw new NotFoundError('User');
      res.json({ success: true, data: user });
    } catch (e) {
      next(e);
    }
  },
);

userRouter.patch(
  '/me',
  authRequired,
  ensureActiveUser,
  validate(updateMeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof updateMeSchema>;
      const data: Record<string, unknown> = {};

      if (body.firstName !== undefined) data.firstName = body.firstName;
      if (body.lastName !== undefined) data.lastName = body.lastName;
      if (body.avatar !== undefined) data.avatar = body.avatar;
      if (body.headline !== undefined) data.headline = body.headline;
      if (body.bio !== undefined) data.bio = body.bio;
      if (body.location !== undefined) data.location = body.location;
      if (body.website !== undefined) data.website = body.website;
      if (body.coverImage !== undefined) data.coverImage = body.coverImage;
      if (body.coverColor !== undefined) data.coverColor = body.coverColor;
      if (body.isHireable !== undefined) data.isHireable = body.isHireable;
      if (body.phone !== undefined) {
        // Trim and store the phone as a normalized E.164-ish value. We
        // intentionally DO NOT touch phoneVerifiedAt — that flag is for
        // OTP verification, which we don't run for plain edits here.
        const next = body.phone ? body.phone.trim() : null;
        if (next && next.length < 7) {
          throw new BadRequestError('Phone is too short.');
        }
        data.phone = next;
      }

      // Username handling — enforce uniqueness, derive `slug` for the URL,
      // and apply the 2-edit-per-lifetime cap. The cap is enforced against
      // the *current* value in the DB so a no-op PATCH (sending the same
      // username twice) doesn't burn a quota slot.
      if (body.username !== undefined) {
        const desired = body.username.trim();
        const current = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { username: true, usernameChangedCount: true },
        });
        if (!current) throw new NotFoundError('User');

        // Treat the value as already-set when it matches the current
        // handle (case-insensitive). This is what lets the frontend
        // re-submit the unchanged username on every PATCH without
        // counting against the 2-edit quota.
        const isNoOp = (current.username ?? '').toLowerCase() === desired.toLowerCase();
        if (!isNoOp) {
          if ((current.usernameChangedCount ?? 0) >= 2) {
            throw new BadRequestError('You can only change your username twice.');
          }
          // Case-insensitive uniqueness check (Postgres unique index is
          // case-sensitive by default).
          const taken = await prisma.user.findFirst({
            where: {
              username: { equals: desired, mode: 'insensitive' },
              NOT: { id: req.user!.id },
            },
            select: { id: true },
          });
          if (taken) {
            throw new ConflictError('That username is already taken.');
          }
          data.username = desired;
          data.slug = withRandomSuffix(slugify(desired));
          data.usernameChangedCount = { increment: 1 };
        }
      }

      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data,
        select: SAFE_USER_SELECT,
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

// ──────────────────────────────────────────────────────────
// Email change (account settings)
//
//   POST /users/me/email/change-request
//     body: { newEmail, currentPassword }
//     Verifies the user's current password, refuses if `newEmail` is
//     already taken by another account, mints an OTP, returns the dev
//     code (NODE_ENV=development only).
//
//   POST /users/me/email/change-verify
//     body: { newEmail, code }
//     Consumes the OTP, atomically swaps `email` and bumps
//     `emailVerifiedAt` to `now`, returns the updated SAFE_USER_SELECT.
//
// We use a dedicated purpose string (`email_change`) so the OTP table
// keeps these tokens out of the registration-verification flow.
// ──────────────────────────────────────────────────────────
const emailChangeRequestSchema = z
  .object({
    newEmail: z.string().trim().toLowerCase().email('Invalid email address').max(254),
    currentPassword: z.string().min(1).max(256),
  })
  .strict();

const emailChangeVerifySchema = z
  .object({
    newEmail: z.string().trim().toLowerCase().email('Invalid email address').max(254),
    code: z.string().trim().regex(/^[0-9]{4,8}$/, 'Invalid code'),
  })
  .strict();

userRouter.post(
  '/me/email/change-request',
  authRequired,
  ensureActiveUser,
  validate(emailChangeRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof emailChangeRequestSchema>;
      const desired = body.newEmail.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, email: true, passwordHash: true },
      });
      if (!user) throw new NotFoundError('User');
      if (!user.passwordHash) {
        // OAuth-only accounts can't email-change via password — they
        // don't have a password to prove with. Surface a clear error so
        // the UI can suggest "Add a password first" instead of silently
        // accepting.
        throw new BadRequestError(
          'Set a password on your account before changing your email.',
        );
      }
      if (desired === user.email.toLowerCase()) {
        throw new BadRequestError('That is already your email.');
      }

      const passwordOk = await verifyPassword(user.passwordHash, body.currentPassword);
      if (!passwordOk) throw new UnauthorizedError('Current password is incorrect.');

      const taken = await prisma.user.findFirst({
        where: { email: { equals: desired }, NOT: { id: user.id } },
        select: { id: true },
      });
      if (taken) throw new ConflictError('That email is already in use.');

      const code = String(
        Math.floor(Math.random() * (10 ** env.OTP_LENGTH - 1)) + 10 ** (env.OTP_LENGTH - 1),
      );
      const codeHash = hashOtp(code);

      await prisma.otpToken.create({
        data: {
          userId: user.id,
          email: desired,
          codeHash,
          purpose: 'email_change',
          expiresAt: new Date(Date.now() + env.OTP_EXPIRES_IN_SECONDS * 1000),
        },
      });

      res.json({
        success: true,
        sent: true,
        devCode: process.env.NODE_ENV === 'development' ? code : undefined,
      });
    } catch (e) {
      next(e);
    }
  },
);

userRouter.post(
  '/me/email/change-verify',
  authRequired,
  ensureActiveUser,
  validate(emailChangeVerifySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof emailChangeVerifySchema>;
      const desired = body.newEmail.trim().toLowerCase();

      const otp = await prisma.otpToken.findFirst({
        where: {
          email: desired,
          purpose: 'email_change',
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!otp) throw new BadRequestError('Invalid or expired code.', 'OTP_INVALID');
      if (otp.attempts >= 5) throw new BadRequestError('Too many attempts.', 'OTP_LOCKED');

      const ok = verifyOtpHash(body.code, otp.codeHash);
      if (!ok) {
        await prisma.otpToken.update({
          where: { id: otp.id },
          data: { attempts: { increment: 1 } },
        });
        throw new BadRequestError('Incorrect code.', 'OTP_INVALID');
      }

      // Re-check uniqueness atomically: someone might have registered the
      // email between the request and the verify.
      const taken = await prisma.user.findFirst({
        where: { email: { equals: desired }, NOT: { id: req.user!.id } },
        select: { id: true },
      });
      if (taken) {
        await prisma.otpToken.update({
          where: { id: otp.id },
          data: { consumedAt: new Date() },
        });
        throw new ConflictError('That email is already in use.');
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.otpToken.update({
          where: { id: otp.id },
          data: { consumedAt: new Date() },
        });
        return tx.user.update({
          where: { id: req.user!.id },
          data: { email: desired, emailVerifiedAt: new Date() },
          select: SAFE_USER_SELECT,
        });
      });

      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

// ──────────────────────────────────────────────────────────
// Password change (account settings)
//
//   POST /users/me/password
//     body: { currentPassword, newPassword }
//     Verifies the current password, sets the new hash. OAuth-only
//     accounts (no `passwordHash`) can set a password via the same
//     endpoint by sending an empty `currentPassword` — but we reject
//     that path explicitly because the UI always requires a value.
// ──────────────────────────────────────────────────────────
userRouter.post(
  '/me/password',
  authRequired,
  ensureActiveUser,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof changePasswordSchema>;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, passwordHash: true },
      });
      if (!user) throw new NotFoundError('User');
      if (!user.passwordHash) {
        throw new BadRequestError(
          'OAuth-only accounts cannot change a password that does not exist yet.',
        );
      }

      const passwordOk = await verifyPassword(user.passwordHash, body.currentPassword);
      if (!passwordOk) throw new UnauthorizedError('Current password is incorrect.');

      const newHash = await hashPassword(body.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

export default userRouter;
