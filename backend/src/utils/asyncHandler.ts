import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler to automatically catch errors
 * and pass them to the next() error handler.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
