import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Cryptographically-secure random string.
 */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashOtp(code: string, salt?: string): string {
  const useSalt = salt ?? randomBytes(8).toString('hex');
  const hash = createHash('sha256').update(`${useSalt}:${code}`).digest('hex');
  return `${useSalt}:${hash}`;
}

export function verifyOtp(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = createHash('sha256').update(`${salt}:${code}`).digest('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidate, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hmacSign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Generates a public-facing verification badge hash (URL-safe, ~16 chars).
 * Used in `/verify/[hash]` links.
 */
export function generateBadgeHash(): string {
  return randomBytes(12)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .toLowerCase();
}