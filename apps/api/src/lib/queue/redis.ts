import { Redis } from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../logger/logger';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function buildRedis(): Redis {
  const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error({ err }, 'Redis error'));

  return redis;
}

export const redis = globalThis.__redis ?? buildRedis();
if (!globalThis.__redis) globalThis.__redis = redis;

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}