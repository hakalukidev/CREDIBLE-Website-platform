import { Queue, Worker, type JobsOptions, type Processor } from 'bullmq';
import { redis } from './redis';
import { env } from '../../config/env';
import { logger } from '../logger/logger';
import { REVIEW_QUEUE_NAMES } from '@credible/shared';

export type JobName =
  | 'send-email'
  | 'process-document'
  | 'analyze-application'
  | 'generate-badge'
  | 'recompute-business-rating'
  | 'process-payment-ipn'
  | 'moderate-review'
  | 'review-notification'
  | 'verification-notification';

type QueueMap = {
  [K in JobName]: Queue;
};

function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    } satisfies JobsOptions,
  });
}

export const queues: QueueMap = {
  'send-email': createQueue(REVIEW_QUEUE_NAMES.EMAIL),
  'process-document': createQueue(REVIEW_QUEUE_NAMES.AI_VERIFICATION),
  // Phase 3 — application-level analysis (one job per submission).
  'analyze-application': createQueue(REVIEW_QUEUE_NAMES.AI_VERIFICATION),
  'generate-badge': createQueue(REVIEW_QUEUE_NAMES.BADGE_GENERATION),
  'recompute-business-rating': createQueue('rating-recompute'),
  'process-payment-ipn': createQueue(REVIEW_QUEUE_NAMES.PAYMENT_IPN),
  'moderate-review': createQueue(REVIEW_QUEUE_NAMES.REVIEW_MODERATION),
  // Phase 2 — review-side notifications (e.g. business replied to a review).
  // Reuses the `notifications` slot from `REVIEW_QUEUE_NAMES`.
  'review-notification': createQueue(REVIEW_QUEUE_NAMES.NOTIFICATIONS),
  // Phase 3 — verification status notifications (approved / rejected / appeal).
  'verification-notification': createQueue(REVIEW_QUEUE_NAMES.NOTIFICATIONS),
};

export function buildWorker(name: string, processor: Processor): Worker {
  const worker = new Worker(name, processor, {
    connection: redis,
    concurrency: env.NODE_ENV === 'production' ? 5 : 2,
  });

  worker.on('completed', (job) => logger.debug({ jobId: job.id, name }, 'Job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, name, err }, 'Job failed'));
  return worker;
}