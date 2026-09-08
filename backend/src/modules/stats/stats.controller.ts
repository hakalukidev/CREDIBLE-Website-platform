/**
 * Public marketing stats for the About page counters and the Community
 * Guidelines transparency section. No auth — by design — but cached for
 * 60 seconds to keep DB load flat even when the homepage is hammered.
 */
import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { prisma } from '../../lib/db/prisma';

const FOUNDING_YEAR = 2024;

interface PublicStats {
  businesses: number;
  reviews: number;
  reviewers: number;
  years: number;
}

let cache: { value: PublicStats; expiresAt: number } | null = null;
// In-flight de-duplication: a hundred concurrent requests in the first
// 60s would otherwise all await the same DB load. Reuse the pending
// promise and only populate `cache` once it resolves.
let pending: Promise<PublicStats> | null = null;
const CACHE_TTL_MS = 60 * 1000;

async function loadStats(): Promise<PublicStats> {
  const now = new Date();
  const [businesses, reviews, reviewers] = await Promise.all([
    prisma.business.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
    prisma.review.count({ where: { status: 'PUBLISHED' } }),
    // Unique authors with at least one published review.
    prisma.user.count({
      where: { reviews: { some: { status: 'PUBLISHED' } } },
    }),
  ]);
  return {
    businesses,
    reviews,
    reviewers,
    years: Math.max(1, now.getFullYear() - FOUNDING_YEAR),
  };
}

const router = Router();

router.get('/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fresh = !cache || cache.expiresAt < Date.now();
    if (fresh) {
      pending ??= loadStats();
      try {
        cache = { value: await pending, expiresAt: Date.now() + CACHE_TTL_MS };
      } finally {
        pending = null;
      }
    }
    res.json({ success: true, data: cache!.value });
  } catch (e) {
    pending = null;
    next(e);
  }
});

export { router as statsRouter };
export default router;
