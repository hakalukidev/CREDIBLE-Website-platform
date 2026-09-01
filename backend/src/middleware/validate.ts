import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req[source];
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return next(parsed.error);
    }
    // Replace with parsed (and coerced) data
    // Using Object.assign to avoid potential frozen state from some clients
    Object.assign(req[source] as object, parsed.data);
    next();
  };
}