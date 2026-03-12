export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message || 'Database operation failed', 500);
    this.name = 'DatabaseError';

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message || 'Resource not found', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message || 'Validation failed', 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message || 'Authentication required', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message || 'Access forbidden', 403);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message || 'Too many requests', 429);
    this.name = 'RateLimitError';
  }
}

export class BusinessError extends AppError {
  public readonly code: string;

  constructor(message: string, code = 'BUSINESS_ERROR') {
    super(message, 422);
    this.name = 'BusinessError';
    this.code = code;
  }
}
