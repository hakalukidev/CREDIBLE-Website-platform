/**
 * Profile CRUD — endpoints for the authenticated user's public profile
 * join tables (social links, skills, experience, education).
 *
 * All routes mounted under `/users/me/profile` in routes/index.ts.
 *
 *   PUT    /users/me/profile/social-links     — replace the full list
 *   PUT    /users/me/profile/skills           — replace the full list (atomic)
 *   POST   /users/me/profile/skills           — add a skill
 *   DELETE /users/me/profile/skills/:id       — remove a skill
 *   PUT    /users/me/profile/skills/order     — reorder the list
 *   PUT    /users/me/profile/experience       — replace the full list (atomic)
 *   POST   /users/me/profile/experience       — add an experience entry
 *   PATCH  /users/me/profile/experience/:id   — edit an experience entry
 *   DELETE /users/me/profile/experience/:id   — remove an experience entry
 *   PUT    /users/me/profile/experience/order — reorder the list
 *   PUT    /users/me/profile/education        — replace the full list (atomic)
 *   POST   /users/me/profile/education        — add an education entry
 *   PATCH  /users/me/profile/education/:id    — edit an education entry
 *   DELETE /users/me/profile/education/:id    — remove an education entry
 *   PUT    /users/me/profile/education/order  — reorder the list
 *
 * "Order" endpoints take `{ ids: string[] }` and rewrite the `position`
 * column on each row to match the array index. They use a single
 * transaction so a partial failure doesn't leave the list half-sorted.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authRequired, ensureActiveUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../lib/db/prisma';
import { NotFoundError } from '../../lib/errors/AppError';

export const profileRouter = Router();

// ──────────────────────────────────────────────────────────
// Social links — replaced wholesale so we don't have to
// implement diffing. The client always sends the canonical list.
// ──────────────────────────────────────────────────────────
const socialLinksSchema = z.object({
  links: z
    .array(
      z.object({
        id: z.string().cuid().optional(),
        platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'website']),
        url: z.string().trim().url().max(2048),
      }),
    )
    .max(20),
});

profileRouter.put(
  '/social-links',
  authRequired,
  ensureActiveUser,
  validate(socialLinksSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const links = (req.body as z.infer<typeof socialLinksSchema>).links;

      await prisma.$transaction([
        prisma.userSocialLink.deleteMany({ where: { userId } }),
        ...(links.length
          ? [
              prisma.userSocialLink.createMany({
                data: links.map((link, idx) => ({
                  userId,
                  platform: link.platform,
                  url: link.url,
                  position: idx,
                })),
              }),
            ]
          : []),
      ]);

      const updated = await prisma.userSocialLink.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
        select: { id: true, platform: true, url: true, position: true },
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

// ──────────────────────────────────────────────────────────
// Skills
// ──────────────────────────────────────────────────────────
const createSkillSchema = z.object({ label: z.string().trim().min(1).max(60) });
const orderSchema = z.object({ ids: z.array(z.string().cuid()).max(200) });

const replaceSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        id: z.string().cuid().optional(),
        label: z.string().trim().min(1).max(60),
      }),
    )
    .max(50),
});

profileRouter.put(
  '/skills',
  authRequired,
  ensureActiveUser,
  validate(replaceSkillsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { skills } = req.body as z.infer<typeof replaceSkillsSchema>;

      // Replace-all semantics: delete the user's current rows, then insert
      // the canonical list inside a single transaction so observers never
      // see an empty intermediate state.
      await prisma.$transaction([
        prisma.userSkill.deleteMany({ where: { userId } }),
        ...(skills.length
          ? [
              prisma.userSkill.createMany({
                data: skills.map((s, idx) => ({
                  userId,
                  label: s.label,
                  position: idx,
                })),
              }),
            ]
          : []),
      ]);

      const updated = await prisma.userSkill.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
        select: { id: true, label: true, position: true },
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.post(
  '/skills',
  authRequired,
  ensureActiveUser,
  validate(createSkillSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { label } = req.body as z.infer<typeof createSkillSchema>;
      const max = await prisma.userSkill.aggregate({
        where: { userId },
        _max: { position: true },
      });
      const position = (max._max.position ?? -1) + 1;
      const skill = await prisma.userSkill.create({
        data: { userId, label, position },
        select: { id: true, label: true, position: true },
      });
      res.json({ success: true, data: skill });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.delete(
  '/skills/:id',
  authRequired,
  ensureActiveUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prisma.userSkill.deleteMany({
        where: { id: String(req.params.id), userId: req.user!.id },
      });
      if (result.count === 0) throw new NotFoundError('Skill');
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.put(
  '/skills/order',
  authRequired,
  ensureActiveUser,
  validate(orderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { ids } = req.body as z.infer<typeof orderSchema>;
      await prisma.$transaction(
        ids.map((id, position) =>
          prisma.userSkill.updateMany({
            where: { id, userId },
            data: { position },
          }),
        ),
      );
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

// ──────────────────────────────────────────────────────────
// Experience
// ──────────────────────────────────────────────────────────
const createExperienceSchema = z.object({
  role: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(120),
  logoUrl: z.string().trim().url().max(2048).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
});

const updateExperienceSchema = createExperienceSchema.partial();

const replaceExperienceSchema = z.object({
  entries: z
    .array(
      createExperienceSchema.extend({
        id: z.string().cuid().optional(),
      }),
    )
    .max(50),
});

profileRouter.put(
  '/experience',
  authRequired,
  ensureActiveUser,
  validate(replaceExperienceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { entries } = req.body as z.infer<typeof replaceExperienceSchema>;

      await prisma.$transaction([
        prisma.userExperience.deleteMany({ where: { userId } }),
        ...(entries.length
          ? [
              prisma.userExperience.createMany({
                data: entries.map((entry, idx) => ({
                  userId,
                  role: entry.role,
                  company: entry.company,
                  logoUrl: entry.logoUrl ?? null,
                  startDate: entry.startDate,
                  endDate: entry.endDate ?? null,
                  description: entry.description ?? null,
                  position: idx,
                })),
              }),
            ]
          : []),
      ]);

      const updated = await prisma.userExperience.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
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
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.post(
  '/experience',
  authRequired,
  ensureActiveUser,
  validate(createExperienceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const body = req.body as z.infer<typeof createExperienceSchema>;
      const max = await prisma.userExperience.aggregate({
        where: { userId },
        _max: { position: true },
      });
      const position = (max._max.position ?? -1) + 1;
      const entry = await prisma.userExperience.create({
        data: {
          userId,
          role: body.role,
          company: body.company,
          logoUrl: body.logoUrl ?? null,
          startDate: body.startDate,
          endDate: body.endDate ?? null,
          description: body.description ?? null,
          position,
        },
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
      });
      res.json({ success: true, data: entry });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.patch(
  '/experience/:id',
  authRequired,
  ensureActiveUser,
  validate(updateExperienceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const body = req.body as z.infer<typeof updateExperienceSchema>;

      const data: Record<string, unknown> = {};
      if (body.role !== undefined) data.role = body.role;
      if (body.company !== undefined) data.company = body.company;
      if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
      if (body.startDate !== undefined) data.startDate = body.startDate;
      if (body.endDate !== undefined) data.endDate = body.endDate;
      if (body.description !== undefined) data.description = body.description;

      const result = await prisma.userExperience.updateMany({
        where: { id, userId },
        data,
      });
      if (result.count === 0) throw new NotFoundError('Experience');

      const entry = await prisma.userExperience.findFirst({
        where: { id, userId },
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
      });
      res.json({ success: true, data: entry });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.delete(
  '/experience/:id',
  authRequired,
  ensureActiveUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prisma.userExperience.deleteMany({
        where: { id: String(req.params.id), userId: req.user!.id },
      });
      if (result.count === 0) throw new NotFoundError('Experience');
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.put(
  '/experience/order',
  authRequired,
  ensureActiveUser,
  validate(orderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { ids } = req.body as z.infer<typeof orderSchema>;
      await prisma.$transaction(
        ids.map((id, position) =>
          prisma.userExperience.updateMany({
            where: { id, userId },
            data: { position },
          }),
        ),
      );
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

// ──────────────────────────────────────────────────────────
// Education
// ──────────────────────────────────────────────────────────
const createEducationSchema = z.object({
  school: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(120).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
});

const updateEducationSchema = createEducationSchema.partial();

const replaceEducationSchema = z.object({
  entries: z
    .array(
      createEducationSchema.extend({
        id: z.string().cuid().optional(),
      }),
    )
    .max(50),
});

profileRouter.put(
  '/education',
  authRequired,
  ensureActiveUser,
  validate(replaceEducationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { entries } = req.body as z.infer<typeof replaceEducationSchema>;

      await prisma.$transaction([
        prisma.userEducation.deleteMany({ where: { userId } }),
        ...(entries.length
          ? [
              prisma.userEducation.createMany({
                data: entries.map((entry, idx) => ({
                  userId,
                  school: entry.school,
                  detail: entry.detail ?? null,
                  startYear: entry.startYear ?? null,
                  endYear: entry.endYear ?? null,
                  position: idx,
                })),
              }),
            ]
          : []),
      ]);

      const updated = await prisma.userEducation.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          school: true,
          detail: true,
          startYear: true,
          endYear: true,
          position: true,
        },
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.post(
  '/education',
  authRequired,
  ensureActiveUser,
  validate(createEducationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const body = req.body as z.infer<typeof createEducationSchema>;
      const max = await prisma.userEducation.aggregate({
        where: { userId },
        _max: { position: true },
      });
      const position = (max._max.position ?? -1) + 1;
      const entry = await prisma.userEducation.create({
        data: {
          userId,
          school: body.school,
          detail: body.detail ?? null,
          startYear: body.startYear ?? null,
          endYear: body.endYear ?? null,
          position,
        },
        select: {
          id: true,
          school: true,
          detail: true,
          startYear: true,
          endYear: true,
          position: true,
        },
      });
      res.json({ success: true, data: entry });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.patch(
  '/education/:id',
  authRequired,
  ensureActiveUser,
  validate(updateEducationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const body = req.body as z.infer<typeof updateEducationSchema>;

      const data: Record<string, unknown> = {};
      if (body.school !== undefined) data.school = body.school;
      if (body.detail !== undefined) data.detail = body.detail;
      if (body.startYear !== undefined) data.startYear = body.startYear;
      if (body.endYear !== undefined) data.endYear = body.endYear;

      const result = await prisma.userEducation.updateMany({
        where: { id, userId },
        data,
      });
      if (result.count === 0) throw new NotFoundError('Education');

      const entry = await prisma.userEducation.findFirst({
        where: { id, userId },
        select: {
          id: true,
          school: true,
          detail: true,
          startYear: true,
          endYear: true,
          position: true,
        },
      });
      res.json({ success: true, data: entry });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.delete(
  '/education/:id',
  authRequired,
  ensureActiveUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prisma.userEducation.deleteMany({
        where: { id: String(req.params.id), userId: req.user!.id },
      });
      if (result.count === 0) throw new NotFoundError('Education');
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.put(
  '/education/order',
  authRequired,
  ensureActiveUser,
  validate(orderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { ids } = req.body as z.infer<typeof orderSchema>;
      await prisma.$transaction(
        ids.map((id, position) =>
          prisma.userEducation.updateMany({
            where: { id, userId },
            data: { position },
          }),
        ),
      );
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
);

// Re-export with a default so it can be imported by name.
export default profileRouter;
