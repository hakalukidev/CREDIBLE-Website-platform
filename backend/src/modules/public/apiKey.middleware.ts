import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors/AppError';
import { apiKeyService, type ApiKeyRecord } from '../../services/apiKeyService';

// Augment Express Request so `req.apiKey` is typed.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: ApiKeyRecord;
    }
  }
}

/**
 * Authenticate the request via the `X-API-Key` header.
 *
 * If a valid key is present we attach `req.apiKey` and (optionally) enforce
 * per-key rate limits. If no key is supplied we still allow the request to
 * proceed but treat it as anonymous — endpoints decide whether to reject.
 */
export async function requireApiKey(req: Request, _res: Response, next: NextFunction) {
  const raw = (req.header('x-api-key') || req.query.api_key) as string | undefined;
  if (!raw) return next(); // anonymous; endpoints decide
  try {
    const record = await apiKeyService.validate(raw);
    if (!record) return next(new UnauthorizedError('Invalid API key'));
    req.apiKey = record;
    return next();
  } catch (e) {
    return next(e);
  }
}

export function requireScope(scope: string) {
  return function (req: Request, _res: Response, next: NextFunction) {
    if (!req.apiKey) return next(new UnauthorizedError('API key required for this endpoint'));
    if (!req.apiKey.scopes.includes(scope)) {
      return next(new ForbiddenError(`Missing scope: ${scope}`));
    }
    return next();
  };
}

/**
 * Track the request for analytics + enforce per-key rate limits.
 * Mounted AFTER route handlers (it runs at response time).
 */
export function trackApiKeyUsage(req: Request, res: Response, next: NextFunction) {
  if (!req.apiKey) return next();
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
    apiKeyService.track({
      apiKeyId: req.apiKey!.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.header('user-agent') ?? undefined,
    });
  });
  return next();
}
