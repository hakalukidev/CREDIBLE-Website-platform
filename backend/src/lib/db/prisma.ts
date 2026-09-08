import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../logger/logger';
import { isProd } from '../../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn'],
  });

if (!isProd) {
  globalThis.__prisma = prisma;
}

prisma
  .$connect()
  .then(() => logger.info('Prisma connected'))
  .catch((err) => logger.error({ err }, 'Prisma connection failed'));

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Union accepted by repository methods so they can run inside a
 * transaction (pass `tx`) or against the global client (default).
 * Identical to the `Prisma.TransactionClient` shape but allows the
 * global client too.
 */
export type DbClient = PrismaClient | Prisma.TransactionClient;