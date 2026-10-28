import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode: ContentfulStatusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, details);
    this.name = 'BadRequestError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
