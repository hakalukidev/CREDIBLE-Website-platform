import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { logger } from '../logger/logger';
import { BadRequestError, NotFoundError } from '../errors/AppError';
import { STORAGE_KEYS } from '@credible/shared';

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
 * Returns `{ url, key, publicUrl, headers }`. The client must PUT the file
 * body with the same `Content-Type` returned in `headers`.
 */
export async function presignedUploadUrl(input: {
  namespace: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
  contentType: string;
  originalName: string;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<{ url: string; key: string; publicUrl: string; expiresIn: number }> {
  if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new BadRequestError(
      'File storage is not configured. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
      'STORAGE_NOT_READY',
    );
  }
  const key = makeObjectKey(input.namespace, input.originalName);
  const bucket = input.bucket ?? env.S3_PUBLIC_BUCKET;
  const expiresIn = input.expiresInSeconds ?? 300;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
    ServerSideEncryption: 'AES256',
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return { url, key, publicUrl: buildPublicUrl(bucket, key), expiresIn };
}

export function buildPublicUrl(bucket: string, key: string): string {
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

export const storage = { uploadObject, deleteObject, presignedDownloadUrl, presignedUploadUrl, makeObjectKey };
export default storage;