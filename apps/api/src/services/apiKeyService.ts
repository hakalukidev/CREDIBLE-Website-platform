import crypto from 'node:crypto';
import { prisma } from '../lib/db/prisma';
import { NotFoundError, AppError } from '../lib/errors/AppError';

const PREFIX = 'ck_'; // Credible key
const KEY_BYTES = 32;

/**
 * Light, self-contained API key service for the public REST API.
 *
 * - The raw key is generated once and only returned in `create()`.
 * - We store a SHA-256 hash + the visible prefix for lookup.
 * - Validation looks up by prefix (small set) then verifies the hash.
 */
function hash(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRaw(): { raw: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(KEY_BYTES).toString('base64url');
  const raw = `${PREFIX}${random}`;
  const prefix = raw.slice(0, 12); // ck_ + 8 chars
  return { raw, prefix, hash: hash(raw) };
}

export interface CreateApiKeyInput {
  userId: string;
  name: string;
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface CreatedApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rateLimit: number;
  expiresAt: Date | null;
  /** Raw key — only available once at creation time. */
  raw: string;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  prefix: string;
  scopes: string[];
  rateLimit: number;
}

class ApiKeyService {
  async create(input: CreateApiKeyInput): Promise<CreatedApiKey> {
    const { raw, prefix, hash: keyHash } = generateRaw();
    const record = await prisma.apiKey.create({
      data: {
        userId: input.userId,
        name: input.name,
        keyHash,
        keyPrefix: prefix,
        scopes: input.scopes ?? ['public.read', 'widget.read'],
        rateLimit: input.rateLimit ?? 60,
        expiresAt: input.expiresAt ?? null,
      },
    });
    return {
      id: record.id,
      name: record.name,
      prefix,
      scopes: record.scopes,
      rateLimit: record.rateLimit,
      expiresAt: record.expiresAt,
      raw,
    };
  }

  async listForUser(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        rateLimit: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(userId: string, id: string): Promise<void> {
    const result = await prisma.apiKey.updateMany({
      where: { id, userId },
      data: { isActive: false },
    });
    if (result.count === 0) throw new NotFoundError('API key');
  }

  /**
   * Validate a raw API key. Returns the active key record (without the hash)
   * or null if invalid/expired.
   */
  async validate(raw: string | undefined | null): Promise<ApiKeyRecord | null> {
    if (!raw || !raw.startsWith(PREFIX)) return null;
    const prefix = raw.slice(0, 12);
    const keyHash = hash(raw);
    const record = await prisma.apiKey.findFirst({
      where: { keyPrefix: prefix, isActive: true },
    });
    if (!record) return null;
    if (record.keyHash !== keyHash) return null;
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null;
    // Bump lastUsedAt — fire and forget so latency stays low.
    prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return {
      id: record.id,
      userId: record.userId,
      prefix: record.keyPrefix,
      scopes: record.scopes,
      rateLimit: record.rateLimit,
    };
  }

  /**
   * Track a request for analytics. Non-blocking.
   */
  track(input: {
    apiKeyId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    ip?: string;
    userAgent?: string;
  }) {
    return prisma.apiRequest
      .create({
        data: {
          apiKeyId: input.apiKeyId,
          method: input.method,
          path: input.path.slice(0, 1024),
          status: input.status,
          durationMs: input.durationMs,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      })
      .catch(() => undefined);
  }
}

export const apiKeyService = new ApiKeyService();
