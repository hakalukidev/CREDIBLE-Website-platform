import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import passport from './config/passport';
import { buildRouter } from './routes';
import { globalRateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './lib/logger/logger';
import { env, isProd } from './config/env';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy (needed when behind a load balancer for rate limiting & X-Forwarded-* headers)
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Disable HSTS in dev to avoid sticky browser caching on localhost.
      strictTransportSecurity: isProd
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(pinoHttp({ logger, useLevel: 'debug' }));

  if (!isProd) {
    app.use(morgan('dev'));
  }

  app.use(passport.initialize());

  app.use(globalRateLimit);

  // Routes
  app.use(env.API_PREFIX, buildRouter());

  // 404 + error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}