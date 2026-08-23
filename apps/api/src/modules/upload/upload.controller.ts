import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { BadRequestError, NotFoundError } from '../../lib/errors/AppError';
import { storage } from '../../lib/storage/s3';
import { verificationRepository } from '../verification/verification.repository';
import { businessRepository } from '../businesses/business.repository';
import { prisma } from '../../lib/db/prisma';
import { uploadRateLimit } from '../../middleware/rateLimit';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { STORAGE_KEYS, presignUploadSchema } from '@credible/shared';
import { queues } from '../../lib/queue/queues';
import { Router } from 'express';
import { validate } from '../../middleware/validate';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

const router = Router();

// Phase 2 — pre-signed upload URL (used by the profile image dropzone).
router.post(
  '/uploads/presign',
  authRequired,
  ensureActiveUser,
  uploadRateLimit,
  validate(presignUploadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await storage.presignedUploadUrl({
        namespace: req.body.namespace,
        contentType: req.body.contentType,
        originalName: req.body.originalName,
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/businesses/:businessId/verification/documents',
  authRequired,
  ensureActiveUser,
  requireRole('BUSINESS'),
  uploadRateLimit,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await businessRepository.findById(req.params.businessId as string);
      if (!business) throw new NotFoundError('Business');
      if (business.ownerId !== req.user!.id) throw new BadRequestError('Not your business');

      const file = req.file;
      if (!file) throw new BadRequestError('No file uploaded');
      if (!ALLOWED_MIME.has(file.mimetype)) {
        throw new BadRequestError(`Unsupported file type: ${file.mimetype}`);
      }

      const docType = (req.body.type as string) ?? 'OTHER';
      const key = storage.makeObjectKey(STORAGE_KEYS.DOCUMENTS, file.originalname);
      const url = await storage.uploadObject({ key, body: file.buffer, contentType: file.mimetype, encrypt: true });

      const latest = await verificationRepository.findLatestForBusiness(business.id);

      const document = await prisma.verificationDocument.create({
        data: {
          businessId: business.id,
          applicationId: latest?.id,
          type: docType as 'TRADE_LICENSE' | 'NATIONAL_ID' | 'TAX_CERTIFICATE' | 'BUSINESS_REGISTRATION' | 'ADDRESS_PROOF' | 'PROFESSIONAL_LICENSE' | 'OTHER',
          status: 'UPLOADED',
          fileKey: key,
          fileUrl: url,
          mimeType: file.mimetype,
          fileSize: file.size,
          originalName: file.originalname,
          encrypted: true,
        },
      });

      // Mark documents-uploaded stage and queue AI processing
      await queues['process-document'].add('process-document', { documentId: document.id });

      res.status(201).json({ success: true, data: document });
    } catch (e) {
      next(e);
    }
  },
);

export { router as uploadRouter };
export default router;