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