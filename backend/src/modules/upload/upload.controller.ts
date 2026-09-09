import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { BadRequestError, NotFoundError } from '../../lib/errors/AppError';
import { storage, NAMESPACE_MAX_BYTES } from '../../lib/storage/s3';
import { verificationRepository } from '../verification/verification.repository';
import { businessRepository } from '../businesses/business.repository';
import { prisma } from '../../lib/db/prisma';
import { uploadRateLimit } from '../../middleware/rateLimit';
import { authRequired, ensureActiveUser, requireRole } from '../../middleware/auth';
import { STORAGE_KEYS, presignUploadSchema } from '@credible/shared';
import { queues } from '../../lib/queue/queues';
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { env } from '../../config/env';
import { logger } from '../../lib/logger/logger';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_BYTES_PROXY = 20 * 1024 * 1024; // proxy route accepts up to the document cap

const ALLOWED_NAMESPACES: Record<string, true> = {
  [STORAGE_KEYS.DOCUMENTS]: true,
  [STORAGE_KEYS.PUBLIC]: true,
  [STORAGE_KEYS.AVATARS]: true,
  [STORAGE_KEYS.BADGES]: true,
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

const uploadProxy = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES_PROXY, files: 1 },
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
        size: req.body.size,
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
);

/**
 * Server-side object upload — the fallback path for direct-to-S3 browser PUTs.
 *
 * Direct browser uploads to R2/S3 require CORS to be configured on the
 * bucket (`AllowedMethods: PUT`). When that's missing the browser blocks the
 * PUT with a CORS error even though the credentials are valid. This route
 * lets the frontend proxy the bytes through the API instead, so uploads keep
 * working without depending on bucket CORS.
 */
router.post(
  '/uploads/object',
  authRequired,
  ensureActiveUser,
  uploadRateLimit,
  uploadProxy.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) throw new BadRequestError('No file uploaded', 'NO_FILE');

      const namespace = (req.body.namespace as string) ?? '';
      if (!ALLOWED_NAMESPACES[namespace]) {
        throw new BadRequestError(`Unknown upload namespace: ${namespace}`, 'INVALID_NAMESPACE');
      }
      if (!ALLOWED_MIME.has(file.mimetype)) {
        throw new BadRequestError(`Unsupported file type: ${file.mimetype}`, 'INVALID_CONTENT_TYPE');
      }

      const maxBytes = NAMESPACE_MAX_BYTES[namespace as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]];
      if (file.size > maxBytes) {
        throw new BadRequestError(
          `File too large. Maximum allowed for ${namespace} is ${Math.round(maxBytes / 1024 / 1024)} MB.`,
          'FILE_TOO_LARGE',
        );
      }

      const key = storage.makeObjectKey(namespace as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], file.originalname);
      const isPrivate = namespace === STORAGE_KEYS.DOCUMENTS;
      const url = await storage.uploadObject({
        key,
        body: file.buffer,
        contentType: file.mimetype,
        bucket: isPrivate ? env.S3_BUCKET : env.S3_PUBLIC_BUCKET,
        encrypt: isPrivate,
      });

      logger.info({ bucket: isPrivate ? env.S3_BUCKET : env.S3_PUBLIC_BUCKET, key, namespace }, 'Proxied object upload');
      res.status(201).json({ success: true, data: { key, publicUrl: url } });
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