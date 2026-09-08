import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger/logger';
import { disconnect as disconnectDb } from './lib/db/prisma';
import { disconnectRedis } from './lib/queue/redis';
import { registerSSLCommerzAdapter } from './lib/payments/sslcommerz.adapter';
import { registerAamarpayAdapter } from './lib/payments/aamarpay.adapter';
import { listRegisteredGateways } from './lib/payments/payment.gateway';

// Phase 4 — register gateway adapters before the first request lands.
registerSSLCommerzAdapter();
registerAamarpayAdapter();
logger.info({ gateways: listRegisteredGateways() }, 'Payment gateways registered');

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
    },
    `🚀 Credible API listening on http://localhost:${env.PORT}${env.API_PREFIX}`,
  );
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, 'Shutting down API...');
  server.close(async () => {
    try {
      await disconnectDb();
      await disconnectRedis();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  });
  // Force shutdown after 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});