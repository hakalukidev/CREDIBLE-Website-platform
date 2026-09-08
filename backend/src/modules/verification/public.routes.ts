/**
 * Public verification lookup — `/verify/:badgeId`.
 *
 * Anyone (no auth) can confirm whether a badge hash is currently valid. The
 * service hides revoked badges but still returns minimal info so legitimate
 * revocation audits remain auditable by third parties.
 */
import { Router } from 'express';
import { NotFoundError } from '../../lib/errors/AppError';
import { verificationService } from './verification.service';

const router = Router();

router.get('/verify/:badgeId', async (req, res, next) => {
  try {
    const badgeId = String(req.params.badgeId);
    const data = await verificationService.publicLookup(badgeId);
    if (!data) throw new NotFoundError('Badge');
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

export { router as publicVerificationRouter };
export default router;