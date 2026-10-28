import type { ErrorHandler, NotFoundHandler } from 'hono';
import { AppError } from '../shared/utils/errors.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: err.message,
        details: err.details,
      },
      err.statusCode
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: 'Validation error',
        details: err.flatten(),
      },
      400
    );
  }

  console.error('Unhandled Server Error:', err);

  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
    500
  );
};

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      success: false,
      error: `Route not found: ${c.req.method} ${c.req.url}`,
    },
    404
  );
};
