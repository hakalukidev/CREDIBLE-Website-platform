/**
 * Edge / middleware-safe JWT verification.
 *
 * Next.js middleware runs on the edge runtime where `jsonwebtoken` (Node's
 * crypto) is unavailable, so we verify HMAC-SHA256 signatures with the Web
 * Crypto API (`crypto.subtle`) instead. Only used to validate dedicated admin
 * tokens in `middleware.ts` / `proxy.ts`.
 */

export interface AdminJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

const encoder = new TextEncoder();

function base64urlDecode(input: string): ArrayBuffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function verifySignature(token: string, secret: string): Promise<boolean> {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64urlDecode(signature),
    encoder.encode(`${header}.${payload}`),
  );
}

/**
 * Verifies the HMAC signature and returns the decoded payload regardless of
 * its role. Callers decide the policy (e.g. middleware answers 404 for a
 * valid-but-non-admin token to keep the admin surface hidden).
 */
export async function verifySignedPayload(
  token: string,
  secret: string,
): Promise<AdminJwtPayload | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const ok = await verifySignature(token, secret);
    if (!ok) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(parts[1])),
    ) as AdminJwtPayload;
    if (!payload.sub) return null;
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifies a dedicated admin JWT. Returns the decoded payload only when the
 * HMAC is valid AND the token carries the `ADMIN` role AND it has not
 * expired; otherwise `null`.
 */
export async function verifyAdminToken(
  token: string,
  secret: string,
): Promise<AdminJwtPayload | null> {
  const payload = await verifySignedPayload(token, secret);
  if (!payload) return null;
  if (payload.role !== 'ADMIN' || payload.type !== 'admin') return null;
  return payload;
}