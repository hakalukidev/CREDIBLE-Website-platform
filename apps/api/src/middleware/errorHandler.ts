import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../lib/errors/AppError';
import { logger } from '../lib/logger/logger';
import { isProd } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const ve = new ValidationError(
      err.flatten().fieldErrors as Record<string, unknown>,
      'Request validation failed',
    );
    return sendError(res, req, ve);
  }

  if (err instanceof AppError) {
    return sendError(res, req, err);
  }

  if (err instanceof Error) {
    logger.error({ err, path: req.originalUrl }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProd ? 'Internal server error' : err.message,
        traceId: (req as Request & { id?: string }).id,
      },
    });
    return;
  }

  logger.error({ err, path: req.originalUrl }, 'Unknown error type');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}

function sendError(res: Response, _req: Request, err: AppError): void {
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.code,
      message: err.message,
      details: err.details,
    },
  });
}