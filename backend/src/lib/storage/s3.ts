import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { logger } from '../logger/logger';
import { BadRequestError, NotFoundError } from '../errors/AppError';
import { STORAGE_KEYS } from '@credible/shared';

/**
 * Per-namespace size limits, in bytes. Mirrored on the frontend so the
 * `presignUploadSchema` and the client-side validation agree.
 */
export const NAMESPACE_MAX_BYTES: Record<(typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], number> = {
  // 5 MB for avatars / public images (logo, cover, etc.).
  [STORAGE_KEYS.AVATARS]: 5 * 1024 * 1024,
  [STORAGE_KEYS.PUBLIC]: 5 * 1024 * 1024,
  // 20 MB for verification documents.
  [STORAGE_KEYS.DOCUMENTS]: 20 * 1024 * 1024,
  [STORAGE_KEYS.BADGES]: 1 * 1024 * 1024,
};

const ALLOWED_CONTENT_TYPES: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'image/gif': true,
  'application/pdf': true,
};

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(env.S3_ENDPOINT),
  credentials:
    env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export interface UploadInput {
  key: string;
  body: Buffer;
  contentType: string;
  bucket?: string;
  encrypt?: boolean;
}

export async function uploadObject(input: UploadInput): Promise<string> {
  const bucket = input.bucket ?? env.S3_BUCKET;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      // Server-side encryption; for R2 use AES256.
      ServerSideEncryption: input.encrypt ? 'AES256' : undefined,
    }),
  );
  logger.info({ bucket, key: input.key }, 'Uploaded object');
  return buildPublicUrl(bucket, input.key);
}

export async function deleteObject(key: string, bucket = env.S3_BUCKET): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Bulk-delete every object under the given key prefix. Used to clean up
 * stale uploads (e.g. a business that uploaded several logo drafts before
 * settling on the final one).
 *
 * Note: S3's `DeleteObjects` accepts up to 1000 keys per call; we page
 * through the list if necessary.
 */
export async function deleteByPrefix(
  prefix: string,
  bucket = env.S3_BUCKET,
  options: { maxKeys?: number } = {},
): Promise<{ deletedCount: number }> {
  const maxKeys = options.maxKeys ?? 1000;
  let continuationToken: string | undefined;
  let totalDeleted = 0;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k));
    if (keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      );
      totalDeleted += keys.length;
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return { deletedCount: totalDeleted };
}

export async function presignedDownloadUrl(
  key: string,
  bucket = env.S3_BUCKET,
  expiresInSeconds = 600,
): Promise<string> {
  if (!key) throw new NotFoundError('File');
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

/**
 * Generates a one-time PUT URL so the client can upload directly to S3/R2.
 * Returns `{ url, key, publicUrl, expiresIn, maxBytes }`. The client must PUT
 * the file body with the same `Content-Type` it sent in the request and
 * within `maxBytes` to keep the signed policy valid.
 */
export async function presignedUploadUrl(input: {
  namespace: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
  contentType: string;
  originalName: string;
  size?: number;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<{
  url: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  maxBytes: number;
  headers: Record<string, string>;
}> {
  if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new BadRequestError(
      'File storage is not configured. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
      'STORAGE_NOT_READY',
    );
  }

  const maxBytes = NAMESPACE_MAX_BYTES[input.namespace];
  if (!maxBytes) {
    throw new BadRequestError(`Unknown upload namespace: ${input.namespace}`, 'INVALID_NAMESPACE');
  }

  if (!ALLOWED_CONTENT_TYPES[input.contentType]) {
    throw new BadRequestError(
      `Unsupported content type: ${input.contentType}. Use jpeg, png, webp, gif, or pdf.`,
      'INVALID_CONTENT_TYPE',
    );
  }

  if (input.size !== undefined) {
    if (input.size <= 0) {
      throw new BadRequestError('File is empty', 'EMPTY_FILE');
    }
    if (input.size > maxBytes) {
      throw new BadRequestError(
        `File too large. Maximum allowed for ${input.namespace} is ${Math.round(maxBytes / 1024 / 1024)} MB.`,
        'FILE_TOO_LARGE',
      );
    }
  }

  const key = makeObjectKey(input.namespace, input.originalName);
  const bucket = input.bucket ?? env.S3_PUBLIC_BUCKET;
  const expiresIn = input.expiresInSeconds ?? 300;

  // Build the PutObject command WITHOUT headers the browser can't easily echo.
  //   - `ServerSideEncryption` is a bucket-level concern — set it as the
  //     default encryption on the bucket (R2 → Settings → Encryption) instead
  //     of putting it in the signed request. Including it here breaks presigned
  //     uploads because clients (fetch / axios) don't send
  //     `x-amz-server-side-encryption`, causing R2 to return
  //     `SignatureDoesNotMatch`.
  //   - `ContentLength` is intentionally NOT signed. We already validated
  //     `size` against the namespace cap server-side; signing `Content-Length`
  //     forces the client to send it, but browsers using `fetch` with a
  //     `File` body often switch to chunked transfer and drop the header,
  //     which then breaks the signature. By leaving it out of the signed
  //     headers, browsers can use chunked upload and still authenticate.
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return {
    url,
    key,
    publicUrl: buildPublicUrl(bucket, key),
    expiresIn,
    maxBytes,
    headers: {
      'Content-Type': input.contentType,
    },
  };
}

export function buildPublicUrl(bucket: string, key: string): string {
  // Prefer the public bucket's custom domain (e.g. https://pub-xxx.r2.dev for
  // Cloudflare R2, or a CDN URL for S3). Falling back to the raw S3 endpoint
  // gives a URL that requires the request to be signed, which breaks public
  // reads in the browser.
  if (env.S3_PUBLIC_BUCKET_URL) {
    return `${env.S3_PUBLIC_BUCKET_URL.replace(/\/$/, '')}/${key}`;
  }
  if (env.S3_ENDPOINT) {
    return `${env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

export function makeObjectKey(
  namespace: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
  originalName: string,
): string {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
  const safeExt = ext && /^[a-zA-Z0-9]+$/.test(ext) ? ext : '';
  const id = randomUUID();
  return `${namespace}/${new Date().getFullYear()}/${id}${safeExt ? `.${safeExt}` : ''}`;
}

export const storage = {
  uploadObject,
  deleteObject,
  deleteByPrefix,
  presignedDownloadUrl,
  presignedUploadUrl,
  makeObjectKey,
  NAMESPACE_MAX_BYTES,
};
export default storage;