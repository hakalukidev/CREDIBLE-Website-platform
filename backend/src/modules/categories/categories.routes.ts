/**
 * Public categories list — Phase 2 stub. Returns the top-level categories.
 * Used by the business profile editor's category multi-select.
 */
import { Router } from 'express';
import { prisma } from '../../lib/db/prisma';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { order: 'asc' },
      select: { id: true, slug: true, name: true, icon: true },
    });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

export { router as categoryRouter };
export default router;