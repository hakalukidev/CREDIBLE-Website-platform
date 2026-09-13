import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../lib/errors/AppError';
import { prisma } from '../lib/db/prisma';
import type { UserRole } from '@credible/types';

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
}

// Augment Express User so passport's `Request.user?: User` picks up our shape
// via declaration merging (passport's @types declare an empty `User`).
declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      traceId?: string;
    }
  }
}

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }
  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: 'ACTIVE',
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) return next();
  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: 'ACTIVE',
    };
  } catch {
    // ignore optional
  }
  next();
}

// An authenticated-but-not-admin user must be given no signal that admin
// routes exist. 404 keeps the surface covert (403 would reveal the route).
export const NOT_FOUND_RESPONSE: [number, { success: false; error: { code: string; message: string } }] = [
  404,
  { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } },
];

/**
 * Verifies a *dedicated admin* JWT (signed with JWT_ADMIN_SECRET). Regular
 * user access tokens are rejected outright — a valid but non-admin token is
 * answered with 404 so the admin surface stays invisible, while missing or
 * invalid tokens get 401.
 */
export function adminAuthRequired(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }
  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as AuthPayload & { type?: string };
    if (payload.role !== 'ADMIN') {
      // Someone swapped in a valid user token but it isn't an admin token.
      const [status, body] = NOT_FOUND_RESPONSE;
      res.status(status).json(body);
      return;
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: 'ADMIN',
      status: 'ACTIVE',
    };
    next();
  } catch (err) {
    // A *valid* foreground-user token must not reveal admin routes either.
    // Detect it quietly and answer with 404; anything else is genuinely
    // unauthenticated (401).
    try {
      const userPayload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      if (userPayload.sub) {
        const [status, body] = NOT_FOUND_RESPONSE;
        res.status(status).json(body);
        return;
      }
    } catch {
      // fall through to 401
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError('Insufficient role'));
    next();
  };
}

/**
 * Ensures the authenticated user still exists and is not suspended.
 * Use after `authRequired` for sensitive endpoints.
 */
export async function ensureActiveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) return next(new UnauthorizedError());
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, status: true, role: true, email: true },
  });
  if (!user || user.status === 'DELETED') return next(new UnauthorizedError('Account no longer exists'));
  if (user.status === 'SUSPENDED') return next(new ForbiddenError('Account suspended'));
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status,
  };
  next();
}