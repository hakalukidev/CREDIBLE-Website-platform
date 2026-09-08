/**
 * Audit log helper.
 *
 * Centralises writes to the `AuditLog` table so admin / system actions have a
 * single source of truth. Every mutating admin endpoint should call `audit(...)`
 * after it succeeds.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

export interface AuditInput {
  actorId: string | null;
  action: string;
  target?: string | null;
  meta?: Prisma.InputJsonValue | null;
}

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        target: input.target ?? null,
        meta: input.meta ?? Prisma.JsonNull,
      },
    });
  } catch (e) {
    // Audit failures must never break the user's request — log and move on.
    // The admin will notice the missing row in the audit viewer.
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write audit log', { action: input.action, err: e });
  }
}